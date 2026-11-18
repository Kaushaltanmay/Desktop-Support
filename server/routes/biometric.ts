import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { calculateLateMinutes, calculateAttendanceMetrics, DEFAULT_SCHEDULE } from '../utils/attendanceCalc';

const router = Router();

interface DeviceRequest extends Request {
  biometricDevice?: {
    id: number;
    device_id: string;
    name: string;
    location: string;
    api_key: string;
    is_active: number;
  };
}

export interface LiveDeviceTelemetry {
  device_id: string;
  last_ping_ms: number;
  wifi_ssid: string;
  ip_address: string;
  rssi: number | null;
  sensor_ready: boolean;
  oled_ready: boolean;
  templates_count: number;
  queued_events: number;
  uptime_seconds: number;
  display_line1: string;
  display_line2: string;
  last_event_type: string;
  ping_count: number;
  rssi_history: Array<{ time: string; rssi: number }>;
}

// Live in-memory telemetry cache (updated every 5 seconds by ESP32 heartbeat)
const liveTelemetry = new Map<string, LiveDeviceTelemetry>();

function getOrCreateTelemetry(deviceId: string): LiveDeviceTelemetry {
  let t = liveTelemetry.get(deviceId);
  if (!t) {
    t = {
      device_id: deviceId,
      last_ping_ms: 0,
      wifi_ssid: '—',
      ip_address: '—',
      rssi: null,
      sensor_ready: false,
      oled_ready: false,
      templates_count: 0,
      queued_events: 0,
      uptime_seconds: 0,
      display_line1: 'Waiting for ESP32',
      display_line2: 'OFFLINE',
      last_event_type: 'NONE',
      ping_count: 0,
      rssi_history: []
    };
    liveTelemetry.set(deviceId, t);
  }
  return t;
}

function rssiToPercent(rssi: number | null): number {
  if (rssi === null || isNaN(rssi)) return 0;
  if (rssi >= -50) return 100;
  if (rssi <= -100) return 0;
  return Math.round(2 * (rssi + 100));
}

function rssiToQuality(rssi: number | null, online: boolean): string {
  if (!online || rssi === null) return 'Offline';
  if (rssi >= -55) return 'Excellent';
  if (rssi >= -67) return 'Good';
  if (rssi >= -78) return 'Fair';
  return 'Weak';
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function firstNameOf(fullName: string): string {
  return (fullName || 'Employee').trim().split(/\s+/)[0].slice(0, 14);
}

// Middleware to authenticate ESP32 hardware devices via X-Device-Key header (or device_key body field)
function authenticateDevice(req: DeviceRequest, res: Response, next: NextFunction) {
  const deviceId = (req.body?.device_id || req.headers['x-device-id'] || '').toString().trim();
  const deviceKey = (req.headers['x-device-key'] || req.body?.device_key || '').toString().trim();

  if (!deviceId || !deviceKey) {
    res.status(401).json({
      status: 'UNAUTHORIZED',
      error: 'Missing device_id or X-Device-Key header.',
      display_line1: 'Auth Error',
      display_line2: 'Check Device Key'
    });
    return;
  }

  const device = db.prepare(
    'SELECT * FROM biometric_devices WHERE device_id = ? AND is_active = 1'
  ).get(deviceId) as any;

  if (!device || device.api_key !== deviceKey) {
    res.status(403).json({
      status: 'FORBIDDEN',
      error: 'Invalid device credentials or inactive terminal.',
      display_line1: 'Access Denied',
      display_line2: 'Invalid Key'
    });
    return;
  }

  // Update device heartbeat timestamp
  db.prepare('UPDATE biometric_devices SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').run(device.id);
  req.biometricDevice = device;
  next();
}

// =========================================================================
// 1. POST /api/biometric/scan  (Called by ESP32 when R307 matches a finger)
// =========================================================================
router.post('/scan', authenticateDevice, (req: DeviceRequest, res: Response) => {
  const device = req.biometricDevice!;
  const { fingerprint_slot, event_id, scanned_at } = req.body;
  const tele = getOrCreateTelemetry(device.device_id);
  tele.last_ping_ms = Date.now();

  if (fingerprint_slot === undefined || fingerprint_slot === null || isNaN(Number(fingerprint_slot))) {
    res.status(400).json({
      status: 'ERROR',
      error: 'Valid numeric fingerprint_slot is required.',
      display_line1: 'Invalid Scan',
      display_line2: 'No Slot ID'
    });
    return;
  }

  const slot = Number(fingerprint_slot);
  const safeEventId = event_id ? String(event_id).trim() : `${device.device_id}-${slot}-${Date.now()}`;

  // 1. Idempotency check
  const existingLog = db.prepare(
    'SELECT * FROM biometric_scan_logs WHERE event_id = ?'
  ).get(safeEventId) as any;

  if (existingLog) {
    res.status(200).json({
      status: existingLog.action,
      duplicate: true,
      message: existingLog.message || 'Event already processed.',
      display_line1: 'Already Synced',
      display_line2: existingLog.action
    });
    return;
  }

  // 2. Lookup employee mapped to (device_id, fingerprint_slot)
  const mapping = db.prepare(`
    SELECT fm.*, u.id as user_id, u.name, u.email, u.role, u.employee_id as emp_code,
           u.office_id, u.work_schedule_id,
           o.latitude as office_lat, o.longitude as office_lon, o.office_name,
           ws.start_time, ws.grace_period_minutes, ws.expected_hours,
           ws.half_day_min_hours, ws.full_day_min_hours, ws.standard_daily_minutes
    FROM fingerprint_mappings fm
    JOIN users u ON fm.employee_id = u.id
    LEFT JOIN offices o ON u.office_id = o.id
    LEFT JOIN work_schedules ws ON u.work_schedule_id = ws.id
    WHERE fm.device_id = ? AND fm.fingerprint_slot = ? AND fm.is_active = 1
  `).get(device.device_id, slot) as any;

  if (!mapping) {
    db.prepare(`
      INSERT INTO biometric_scan_logs (event_id, device_id, fingerprint_slot, employee_id, action, message)
      VALUES (?, ?, ?, NULL, 'REJECTED_UNKNOWN', ?)
    `).run(safeEventId, device.device_id, slot, `Unmapped fingerprint slot #${slot}`);

    tele.display_line1 = 'Unregistered';
    tele.display_line2 = `Slot #${slot}`;
    tele.last_event_type = 'REJECTED';

    res.status(404).json({
      status: 'REJECTED',
      error: `Fingerprint slot #${slot} is not assigned to any employee.`,
      display_line1: 'Unregistered',
      display_line2: `Slot #${slot}`
    });
    return;
  }

  const employeeId = mapping.user_id;
  const shortName = firstNameOf(mapping.name);

  // 3. 30-second cooldown check
  const recentScan = db.prepare(`
    SELECT id, created_at FROM biometric_scan_logs
    WHERE employee_id = ? AND action IN ('PUNCH_IN', 'PUNCH_OUT')
      AND created_at >= datetime('now', '-30 seconds')
    ORDER BY id DESC LIMIT 1
  `).get(employeeId) as any;

  if (recentScan) {
    db.prepare(`
      INSERT INTO biometric_scan_logs (event_id, device_id, fingerprint_slot, employee_id, action, message)
      VALUES (?, ?, ?, ?, 'COOLDOWN', 'Ignored duplicate scan within 30s cooldown')
    `).run(safeEventId, device.device_id, slot, employeeId);

    tele.display_line1 = shortName;
    tele.display_line2 = 'Wait 30s...';
    tele.last_event_type = 'COOLDOWN';

    res.status(200).json({
      status: 'COOLDOWN',
      employee: { id: employeeId, name: mapping.name, employee_code: mapping.emp_code },
      message: 'Scan ignored: please wait 30 seconds between punches.',
      display_line1: shortName,
      display_line2: 'Wait 30s...'
    });
    return;
  }

  // 4. Process Punch In / Punch Out
  const scanTime = scanned_at ? new Date(scanned_at) : new Date();
  const validScanTime = isNaN(scanTime.getTime()) ? new Date() : scanTime;
  const nowIso = validScanTime.toISOString();
  const today = nowIso.split('T')[0] || getTodayString();

  const officeLat = mapping.office_lat ?? 30.7333;
  const officeLon = mapping.office_lon ?? 76.7794;
  const deviceInfo = `ESP32 Biometric Terminal (${device.device_id}) - Slot #${slot}`;

  const existingAttendance = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?'
  ).get(employeeId, today) as any;

  // CASE A: First valid scan today -> PUNCH IN
  if (!existingAttendance || !existingAttendance.punch_in_at) {
    const lateMinutes = calculateLateMinutes(
      validScanTime,
      mapping.start_time || DEFAULT_SCHEDULE.start_time,
      mapping.grace_period_minutes ?? DEFAULT_SCHEDULE.grace_period_minutes
    );

    let attendanceId: number;
    if (existingAttendance) {
      db.prepare(`
        UPDATE attendance
        SET punch_in_at = ?, punch_in_latitude = ?, punch_in_longitude = ?, punch_in_accuracy = 0,
            late_minutes = ?, status = 'WORKING', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(nowIso, officeLat, officeLon, lateMinutes, existingAttendance.id);
      attendanceId = existingAttendance.id;
    } else {
      const insertRes = db.prepare(`
        INSERT INTO attendance (
          employee_id, office_id, work_schedule_id, attendance_date,
          punch_in_at, punch_in_latitude, punch_in_longitude, punch_in_accuracy,
          late_minutes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'WORKING')
      `).run(
        employeeId,
        mapping.office_id || 1,
        mapping.work_schedule_id || 1,
        today,
        nowIso,
        officeLat,
        officeLon,
        lateMinutes
      );
      attendanceId = Number(insertRes.lastInsertRowid);
    }

    db.prepare(`
      INSERT INTO attendance_events (
        employee_id, attendance_id, event_type, timestamp,
        latitude, longitude, accuracy, office_id, distance_from_office, device_information
      ) VALUES (?, ?, 'PUNCH_IN', ?, ?, ?, 0, ?, 0, ?)
    `).run(employeeId, attendanceId, nowIso, officeLat, officeLon, mapping.office_id || 1, deviceInfo);

    db.prepare(`
      INSERT INTO biometric_scan_logs (event_id, device_id, fingerprint_slot, employee_id, action, message)
      VALUES (?, ?, ?, ?, 'PUNCH_IN', ?)
    `).run(safeEventId, device.device_id, slot, employeeId, `Biometric Punch IN for ${mapping.name}`);

    db.prepare(`
      INSERT INTO audit_logs (entity_type, entity_id, user_id, action, new_value, description)
      VALUES ('ATTENDANCE', ?, ?, 'BIOMETRIC_PUNCH_IN', 'WORKING', ?)
    `).run(attendanceId, employeeId, `${mapping.name} punched IN via ${deviceInfo}`);

    const l1 = `Hi ${shortName}`;
    const l2 = lateMinutes > 0 ? `IN (Late ${lateMinutes}m)` : 'Punched IN!';
    tele.display_line1 = l1;
    tele.display_line2 = l2;
    tele.last_event_type = 'PUNCH_IN';

    res.status(200).json({
      status: 'PUNCH_IN',
      employee: { id: employeeId, name: mapping.name, employee_code: mapping.emp_code },
      attendance_id: attendanceId,
      punch_in_at: nowIso,
      late_minutes: lateMinutes,
      message: `Punch In successful for ${mapping.name}`,
      display_line1: l1,
      display_line2: l2
    });
    return;
  }

  // CASE B: Already punched in -> PUNCH OUT
  if (!existingAttendance.punch_out_at) {
    const punchInTime = new Date(existingAttendance.punch_in_at);
    const schedule = {
      start_time: mapping.start_time || DEFAULT_SCHEDULE.start_time,
      end_time: '18:30',
      grace_period_minutes: mapping.grace_period_minutes ?? 10,
      expected_hours: mapping.expected_hours || 9.0,
      half_day_min_hours: mapping.half_day_min_hours || 4.0,
      full_day_min_hours: mapping.full_day_min_hours || 8.0,
      standard_daily_minutes: mapping.standard_daily_minutes || 540
    };

    const metrics = calculateAttendanceMetrics(punchInTime, validScanTime, schedule);

    db.prepare(`
      UPDATE attendance
      SET punch_out_at = ?, punch_out_latitude = ?, punch_out_longitude = ?, punch_out_accuracy = 0,
          total_work_minutes = ?, regular_work_minutes = ?, overtime_minutes = ?,
          status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      nowIso,
      officeLat,
      officeLon,
      metrics.totalWorkMinutes,
      metrics.regularWorkMinutes,
      metrics.overtimeMinutes,
      metrics.status,
      existingAttendance.id
    );

    db.prepare(`
      INSERT INTO attendance_events (
        employee_id, attendance_id, event_type, timestamp,
        latitude, longitude, accuracy, office_id, distance_from_office, device_information
      ) VALUES (?, ?, 'PUNCH_OUT', ?, ?, ?, 0, ?, 0, ?)
    `).run(employeeId, existingAttendance.id, nowIso, officeLat, officeLon, mapping.office_id || 1, deviceInfo);

    db.prepare(`
      INSERT INTO biometric_scan_logs (event_id, device_id, fingerprint_slot, employee_id, action, message)
      VALUES (?, ?, ?, ?, 'PUNCH_OUT', ?)
    `).run(safeEventId, device.device_id, slot, employeeId, `Biometric Punch OUT for ${mapping.name} (${metrics.totalWorkMinutes}m)`);

    db.prepare(`
      INSERT INTO audit_logs (entity_type, entity_id, user_id, action, new_value, description)
      VALUES ('ATTENDANCE', ?, ?, 'BIOMETRIC_PUNCH_OUT', ?, ?)
    `).run(existingAttendance.id, employeeId, metrics.status, `${mapping.name} punched OUT via ${deviceInfo}`);

    const hrs = (metrics.totalWorkMinutes / 60).toFixed(1);
    const l1 = `Bye ${shortName}`;
    const l2 = `OUT (${hrs}h)`;
    tele.display_line1 = l1;
    tele.display_line2 = l2;
    tele.last_event_type = 'PUNCH_OUT';

    res.status(200).json({
      status: 'PUNCH_OUT',
      employee: { id: employeeId, name: mapping.name, employee_code: mapping.emp_code },
      attendance_id: existingAttendance.id,
      punch_out_at: nowIso,
      total_work_minutes: metrics.totalWorkMinutes,
      message: `Punch Out successful for ${mapping.name}`,
      display_line1: l1,
      display_line2: l2
    });
    return;
  }

  // CASE C: Both completed today
  db.prepare(`
    INSERT INTO biometric_scan_logs (event_id, device_id, fingerprint_slot, employee_id, action, message)
    VALUES (?, ?, ?, ?, 'ALREADY_COMPLETED', 'Attendance already completed for today')
  `).run(safeEventId, device.device_id, slot, employeeId);

  tele.display_line1 = shortName;
  tele.display_line2 = 'Done For Today';
  tele.last_event_type = 'ALREADY_COMPLETED';

  res.status(200).json({
    status: 'ALREADY_COMPLETED',
    employee: { id: employeeId, name: mapping.name, employee_code: mapping.emp_code },
    message: `${mapping.name} has already completed attendance today.`,
    display_line1: shortName,
    display_line2: 'Done For Today'
  });
});

// =========================================================================
// 2. POST /api/biometric/heartbeat  (ESP32 pings every 5s with live Wi-Fi & status!)
// =========================================================================
router.post('/heartbeat', authenticateDevice, (req: DeviceRequest, res: Response) => {
  const device = req.biometricDevice!;
  const tele = getOrCreateTelemetry(device.device_id);
  const nowMs = Date.now();

  tele.last_ping_ms = nowMs;
  tele.ping_count += 1;
  if (req.body.wifi_ssid !== undefined) tele.wifi_ssid = String(req.body.wifi_ssid);
  if (req.body.ip_address !== undefined) tele.ip_address = String(req.body.ip_address);
  if (req.body.rssi !== undefined && !isNaN(Number(req.body.rssi))) {
    const rssiVal = Number(req.body.rssi);
    tele.rssi = rssiVal;
    tele.rssi_history.push({ time: new Date().toLocaleTimeString(), rssi: rssiVal });
    if (tele.rssi_history.length > 20) tele.rssi_history.shift();
  }
  if (req.body.sensor_ready !== undefined) tele.sensor_ready = Boolean(req.body.sensor_ready);
  if (req.body.oled_ready !== undefined) tele.oled_ready = Boolean(req.body.oled_ready);
  if (req.body.templates_count !== undefined) tele.templates_count = Number(req.body.templates_count) || 0;
  if (req.body.queued_events !== undefined) tele.queued_events = Number(req.body.queued_events) || 0;
  if (req.body.uptime_seconds !== undefined) tele.uptime_seconds = Number(req.body.uptime_seconds) || 0;
  if (req.body.display_line1 !== undefined) tele.display_line1 = String(req.body.display_line1);
  if (req.body.display_line2 !== undefined) tele.display_line2 = String(req.body.display_line2);

  const pendingCmd = db.prepare(`
    SELECT bc.*, u.name as employee_name
    FROM biometric_commands bc
    LEFT JOIN users u ON bc.employee_id = u.id
    WHERE bc.device_id = ? AND bc.status = 'PENDING'
    ORDER BY bc.id ASC LIMIT 1
  `).get(device.device_id) as any;

  if (pendingCmd) {
    db.prepare(`
      UPDATE biometric_commands SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(pendingCmd.id);
  }

  res.json({
    status: 'ONLINE',
    server_time: new Date().toISOString(),
    device_id: device.device_id,
    pending_command: pendingCmd
      ? {
          command_id: pendingCmd.id,
          command: pendingCmd.command,
          fingerprint_slot: pendingCmd.fingerprint_slot,
          employee_id: pendingCmd.employee_id,
          employee_name: pendingCmd.employee_name || ''
        }
      : null
  });
});

// =========================================================================
// 3. POST /api/biometric/command-result  (ESP32 confirms ENROLL / DELETE)
// =========================================================================
router.post('/command-result', authenticateDevice, (req: DeviceRequest, res: Response) => {
  const device = req.biometricDevice!;
  const { command_id, success, message } = req.body;
  const tele = getOrCreateTelemetry(device.device_id);
  tele.last_ping_ms = Date.now();

  const cmd = db.prepare(
    'SELECT * FROM biometric_commands WHERE id = ? AND device_id = ?'
  ).get(command_id, device.device_id) as any;

  if (!cmd) {
    res.status(404).json({ error: 'Command not found.' });
    return;
  }

  const finalStatus = success ? 'COMPLETED' : 'FAILED';
  db.prepare(`
    UPDATE biometric_commands
    SET status = ?, result_message = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(finalStatus, message || '', cmd.id);

  tele.display_line1 = success ? `${cmd.command} OK` : `${cmd.command} Failed`;
  tele.display_line2 = cmd.fingerprint_slot ? `Slot #${cmd.fingerprint_slot}` : '';

  if (success) {
    if (cmd.command === 'ENROLL' && cmd.employee_id && cmd.fingerprint_slot) {
      db.prepare(`
        INSERT INTO fingerprint_mappings (employee_id, device_id, fingerprint_slot, is_active)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(device_id, fingerprint_slot) DO UPDATE SET
          employee_id = excluded.employee_id,
          is_active = 1,
          enrolled_at = CURRENT_TIMESTAMP
      `).run(cmd.employee_id, device.device_id, cmd.fingerprint_slot);
    } else if (cmd.command === 'DELETE' && cmd.fingerprint_slot) {
      db.prepare(
        'DELETE FROM fingerprint_mappings WHERE device_id = ? AND fingerprint_slot = ?'
      ).run(device.device_id, cmd.fingerprint_slot);
    } else if (cmd.command === 'CLEAR_ALL') {
      db.prepare('DELETE FROM fingerprint_mappings WHERE device_id = ?').run(device.device_id);
    }
  }

  res.json({ status: 'OK', command_status: finalStatus });
});

// =========================================================================
// 4. POST /api/biometric/scan-failed  (ESP32 logs unrecognized finger attempts)
// =========================================================================
router.post('/scan-failed', authenticateDevice, (req: DeviceRequest, res: Response) => {
  const device = req.biometricDevice!;
  const { reason } = req.body;
  const eventId = `${device.device_id}-FAIL-${Date.now()}`;
  const tele = getOrCreateTelemetry(device.device_id);
  tele.last_ping_ms = Date.now();
  tele.display_line1 = 'Not Recognised';
  tele.display_line2 = 'Try Again';
  tele.last_event_type = 'FAILED_SCAN';

  db.prepare(`
    INSERT INTO biometric_scan_logs (event_id, device_id, fingerprint_slot, employee_id, action, message)
    VALUES (?, ?, NULL, NULL, 'REJECTED_UNKNOWN', ?)
  `).run(eventId, device.device_id, reason || 'Unrecognized fingerprint attempt');

  res.json({ status: 'LOGGED' });
});

// =========================================================================
// LIVE DASHBOARD & MANAGEMENT ENDPOINTS (Protected by JWT)
// =========================================================================

// GET /api/biometric/status  (Polled every 2-3s by the ESP32 Live Monitor page!)
router.get('/status', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  const dbDevices = db.prepare(`
    SELECT d.id, d.device_id, d.name, d.location, d.is_active, d.last_seen_at,
      (SELECT COUNT(*) FROM fingerprint_mappings fm WHERE fm.device_id = d.device_id AND fm.is_active = 1) as mapped_count
    FROM biometric_devices d
    ORDER BY d.id ASC
  `).all() as any[];

  const now = Date.now();
  const devices = dbDevices.map(d => {
    const tele = getOrCreateTelemetry(d.device_id);
    const secondsSincePing = tele.last_ping_ms > 0 ? Math.max(0, Math.floor((now - tele.last_ping_ms) / 1000)) : null;
    // Considered ONLINE if ping received within the last 12 seconds (ESP32 pings every 5s)
    const isOnline = secondsSincePing !== null && secondsSincePing <= 12;

    return {
      ...d,
      is_online: isOnline,
      seconds_since_last_seen: secondsSincePing,
      wifi_ssid: tele.wifi_ssid,
      ip_address: tele.ip_address,
      rssi: isOnline ? tele.rssi : null,
      signal_percent: isOnline ? rssiToPercent(tele.rssi) : 0,
      signal_quality: rssiToQuality(tele.rssi, isOnline),
      sensor_ready: tele.sensor_ready,
      oled_ready: tele.oled_ready,
      templates_count: tele.templates_count,
      queued_events: tele.queued_events,
      uptime_seconds: tele.uptime_seconds,
      display_line1: isOnline ? tele.display_line1 : 'ESP32 Offline',
      display_line2: isOnline ? tele.display_line2 : (secondsSincePing !== null ? `Lost ${secondsSincePing}s ago` : 'Waiting for ping...'),
      ping_count: tele.ping_count,
      rssi_history: tele.rssi_history
    };
  });

  const mappings = db.prepare(`
    SELECT fm.*, u.name as employee_name, u.email, u.employee_id as emp_code, u.role
    FROM fingerprint_mappings fm
    JOIN users u ON fm.employee_id = u.id
    ORDER BY fm.fingerprint_slot ASC
  `).all();

  const recent_logs = db.prepare(`
    SELECT l.*, u.name as employee_name, u.employee_id as emp_code
    FROM biometric_scan_logs l
    LEFT JOIN users u ON l.employee_id = u.id
    ORDER BY l.id DESC LIMIT 25
  `).all();

  const pending_commands = db.prepare(`
    SELECT bc.*, u.name as employee_name
    FROM biometric_commands bc
    LEFT JOIN users u ON bc.employee_id = u.id
    WHERE bc.status IN ('PENDING', 'IN_PROGRESS')
    ORDER BY bc.id DESC LIMIT 10
  `).all();

  res.json({
    server_time: new Date().toISOString(),
    devices,
    mappings,
    recent_logs,
    pending_commands
  });
});

// GET /api/biometric/devices
router.get('/devices', authenticateToken, requireRole(['ADMIN', 'IT_ENGINEER', 'HR']), (_req: AuthenticatedRequest, res: Response) => {
  const devices = db.prepare(`
    SELECT d.*,
      (SELECT COUNT(*) FROM fingerprint_mappings fm WHERE fm.device_id = d.device_id AND fm.is_active = 1) as enrolled_count
    FROM biometric_devices d
    ORDER BY d.id ASC
  `).all();
  res.json({ devices });
});

// GET /api/biometric/mappings
router.get('/mappings', authenticateToken, requireRole(['ADMIN', 'IT_ENGINEER', 'HR']), (_req: AuthenticatedRequest, res: Response) => {
  const mappings = db.prepare(`
    SELECT fm.*, u.name as employee_name, u.email, u.employee_id as emp_code, u.role
    FROM fingerprint_mappings fm
    JOIN users u ON fm.employee_id = u.id
    ORDER BY fm.fingerprint_slot ASC
  `).all();
  res.json({ mappings });
});

// POST /api/biometric/mappings  (Assign employee <-> slot, optionally queue ESP32 remote enrollment)
router.post('/mappings', authenticateToken, requireRole(['ADMIN', 'IT_ENGINEER', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, device_id = 'DEVICE001', fingerprint_slot, trigger_enroll = false } = req.body;

  if (!employee_id || !fingerprint_slot || Number(fingerprint_slot) < 1 || Number(fingerprint_slot) > 1000) {
    res.status(400).json({ error: 'Valid employee_id and fingerprint_slot (1–1000) are required.' });
    return;
  }

  db.prepare(`
    INSERT INTO fingerprint_mappings (employee_id, device_id, fingerprint_slot, is_active)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(device_id, fingerprint_slot) DO UPDATE SET
      employee_id = excluded.employee_id,
      is_active = 1,
      enrolled_at = CURRENT_TIMESTAMP
  `).run(Number(employee_id), device_id, Number(fingerprint_slot));

  let queuedCommandId: number | null = null;
  if (trigger_enroll) {
    const cmdRes = db.prepare(`
      INSERT INTO biometric_commands (device_id, command, fingerprint_slot, employee_id, status)
      VALUES (?, 'ENROLL', ?, ?, 'PENDING')
    `).run(device_id, Number(fingerprint_slot), Number(employee_id));
    queuedCommandId = Number(cmdRes.lastInsertRowid);
  }

  res.status(201).json({
    message: trigger_enroll
      ? `Queued remote enrollment for Slot #${fingerprint_slot}! Place finger on R307 when RGB LED turns Blue.`
      : `Mapped employee #${employee_id} to slot #${fingerprint_slot} on ${device_id}.`,
    queued_command_id: queuedCommandId
  });
});

// DELETE /api/biometric/mappings/:slot
router.delete('/mappings/:slot', authenticateToken, requireRole(['ADMIN', 'IT_ENGINEER', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const slot = Number(req.params.slot);
  const deviceId = String(req.query.device_id || 'DEVICE001');
  const triggerDelete = req.query.trigger_delete === 'true';

  db.prepare('DELETE FROM fingerprint_mappings WHERE device_id = ? AND fingerprint_slot = ?').run(deviceId, slot);

  if (triggerDelete) {
    db.prepare(`
      INSERT INTO biometric_commands (device_id, command, fingerprint_slot, status)
      VALUES (?, 'DELETE', ?, 'PENDING')
    `).run(deviceId, slot);
  }

  res.json({ message: `Removed fingerprint mapping for slot #${slot} on ${deviceId}.` });
});

// GET /api/biometric/logs
router.get('/logs', authenticateToken, requireRole(['ADMIN', 'IT_ENGINEER', 'HR']), (_req: AuthenticatedRequest, res: Response) => {
  const logs = db.prepare(`
    SELECT l.*, u.name as employee_name, u.employee_id as emp_code
    FROM biometric_scan_logs l
    LEFT JOIN users u ON l.employee_id = u.id
    ORDER BY l.id DESC LIMIT 100
  `).all();
  res.json({ logs });
});

export default router;
