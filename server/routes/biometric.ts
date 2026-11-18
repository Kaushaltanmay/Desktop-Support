import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

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

  // 3. 30-second cooldown check (prevent accidental double door taps)
  const recentScan = db.prepare(`
    SELECT id, created_at FROM biometric_scan_logs
    WHERE employee_id = ? AND action IN ('LAB_IN', 'LAB_OUT', 'PUNCH_IN', 'PUNCH_OUT')
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
      message: 'Scan ignored: please wait 30 seconds between door scans.',
      display_line1: shortName,
      display_line2: 'Wait 30s...'
    });
    return;
  }

  // 4. Process Biometric Lab Door Entry / Exit (100% SEPARATE from App GPS Attendance!)
  const scanTime = scanned_at ? new Date(scanned_at) : new Date();
  const validScanTime = isNaN(scanTime.getTime()) ? new Date() : scanTime;
  const nowIso = validScanTime.toISOString();
  const today = nowIso.split('T')[0] || getTodayString();
  const deviceInfo = `ESP32 Lab Door (${device.device_id}) - UART Slot #${slot}`;

  // Check if employee currently has an open IN_LAB session (multiple entries/exits per day supported!)
  const openLabSession = db.prepare(`
    SELECT * FROM biometric_lab_attendance
    WHERE employee_id = ? AND status = 'IN_LAB' AND out_time IS NULL
    ORDER BY id DESC LIMIT 1
  `).get(employeeId) as any;

  // CASE A: Employee is entering the lab -> LAB IN
  if (!openLabSession) {
    const insertRes = db.prepare(`
      INSERT INTO biometric_lab_attendance (
        employee_id, device_id, fingerprint_slot, attendance_date, in_time, status
      ) VALUES (?, ?, ?, ?, ?, 'IN_LAB')
    `).run(employeeId, device.device_id, slot, today, nowIso);
    const labSessionId = Number(insertRes.lastInsertRowid);

    db.prepare(`
      INSERT INTO biometric_scan_logs (event_id, device_id, fingerprint_slot, employee_id, action, message)
      VALUES (?, ?, ?, ?, 'LAB_IN', ?)
    `).run(safeEventId, device.device_id, slot, employeeId, `${mapping.name} entered Lab (UART Slot #${slot})`);

    db.prepare(`
      INSERT INTO audit_logs (entity_type, entity_id, user_id, action, new_value, description)
      VALUES ('BIOMETRIC_DOOR', ?, ?, 'BIOMETRIC_LAB_IN', 'IN_LAB', ?)
    `).run(labSessionId, employeeId, `${mapping.name} entered Lab via ${deviceInfo}`);

    const l1 = `Hi ${shortName}`;
    const l2 = 'LAB IN!';
    tele.display_line1 = l1;
    tele.display_line2 = l2;
    tele.last_event_type = 'LAB_IN';

    res.status(200).json({
      status: 'LAB_IN',
      employee: { id: employeeId, name: mapping.name, employee_code: mapping.emp_code },
      lab_session_id: labSessionId,
      fingerprint_slot: slot,
      in_time: nowIso,
      message: `${mapping.name} entered the Lab (UART Slot #${slot})`,
      display_line1: l1,
      display_line2: l2
    });
    return;
  }

  // CASE B: Employee is currently inside the lab -> LAB OUT
  const inDate = new Date(openLabSession.in_time);
  const durationMinutes = Math.max(0, Math.round((validScanTime.getTime() - inDate.getTime()) / 60000));

  db.prepare(`
    UPDATE biometric_lab_attendance
    SET out_time = ?, duration_minutes = ?, status = 'OUT_LAB', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nowIso, durationMinutes, openLabSession.id);

  const durLabel = durationMinutes >= 60
    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
    : `${durationMinutes}m`;

  db.prepare(`
    INSERT INTO biometric_scan_logs (event_id, device_id, fingerprint_slot, employee_id, action, message)
    VALUES (?, ?, ?, ?, 'LAB_OUT', ?)
  `).run(safeEventId, device.device_id, slot, employeeId, `${mapping.name} exited Lab after ${durLabel} (UART Slot #${slot})`);

  db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, user_id, action, new_value, description)
    VALUES ('BIOMETRIC_DOOR', ?, ?, 'BIOMETRIC_LAB_OUT', 'OUT_LAB', ?)
  `).run(openLabSession.id, employeeId, `${mapping.name} exited Lab after ${durLabel} via ${deviceInfo}`);

  const l1 = `Bye ${shortName}`;
  const l2 = `OUT (${durLabel})`;
  tele.display_line1 = l1;
  tele.display_line2 = l2;
  tele.last_event_type = 'LAB_OUT';

  res.status(200).json({
    status: 'LAB_OUT',
    employee: { id: employeeId, name: mapping.name, employee_code: mapping.emp_code },
    lab_session_id: openLabSession.id,
    fingerprint_slot: slot,
    in_time: openLabSession.in_time,
    out_time: nowIso,
    duration_minutes: durationMinutes,
    message: `${mapping.name} exited the Lab (${durLabel})`,
    display_line1: l1,
    display_line2: l2
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

  const cmd = db.prepare(`
    SELECT bc.*, u.name as employee_name
    FROM biometric_commands bc
    LEFT JOIN users u ON bc.employee_id = u.id
    WHERE bc.id = ? AND bc.device_id = ?
  `).get(command_id, device.device_id) as any;

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

  const logAction = `${cmd.command}_${success ? 'SUCCESS' : 'FAILED'}`;
  const empLabel = cmd.employee_name || (cmd.employee_id ? `Employee #${cmd.employee_id}` : 'Terminal');
  const slotLabel = cmd.fingerprint_slot ? `UART Slot #${cmd.fingerprint_slot}` : 'All Slots';
  const logMsg = success
    ? (cmd.command === 'ENROLL'
        ? `Fingerprint enrolled successfully for ${empLabel} (${slotLabel})`
        : cmd.command === 'DELETE'
          ? `Fingerprint template deleted (${slotLabel})`
          : `All fingerprint templates cleared on ${device.device_id}`)
    : `${cmd.command} failed for ${empLabel} (${slotLabel}): ${message || 'Sensor timeout / mismatch'}`;

  db.prepare(`
    INSERT INTO biometric_scan_logs (event_id, device_id, fingerprint_slot, employee_id, action, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(`${device.device_id}-CMD-${cmd.id}-${Date.now()}`, device.device_id, cmd.fingerprint_slot || null, cmd.employee_id || null, logAction, logMsg);

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

  // Separate Biometric Lab Door Entry/Exit sessions (distinct from App GPS Attendance)
  const lab_sessions = db.prepare(`
    SELECT b.*, u.name as employee_name, u.email, u.employee_id as emp_code, u.role,
           d.name as department_name
    FROM biometric_lab_attendance b
    JOIN users u ON b.employee_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    ORDER BY b.id DESC LIMIT 50
  `).all();

  const currently_in_lab = db.prepare(`
    SELECT b.*, u.name as employee_name, u.employee_id as emp_code, d.name as department_name
    FROM biometric_lab_attendance b
    JOIN users u ON b.employee_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE b.status = 'IN_LAB' AND b.out_time IS NULL
    ORDER BY b.in_time DESC
  `).all();

  res.json({
    server_time: new Date().toISOString(),
    devices,
    mappings,
    recent_logs,
    pending_commands,
    lab_sessions,
    currently_in_lab
  });
});

// GET /api/biometric/lab-attendance  (Dedicated HR & ESP32 Lab Door Attendance Register)
router.get('/lab-attendance', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { date, status, search } = req.query;

  let query = `
    SELECT b.*, u.name as employee_name, u.email, u.employee_id as emp_code, u.role,
           d.name as department_name
    FROM biometric_lab_attendance b
    JOIN users u ON b.employee_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (date) {
    query += ` AND b.attendance_date = ?`;
    params.push(String(date));
  }
  if (status && status !== 'all') {
    query += ` AND b.status = ?`;
    params.push(String(status));
  }
  if (search) {
    query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.employee_id LIKE ?)`;
    const p = `%${String(search)}%`;
    params.push(p, p, p);
  }

  query += ` ORDER BY b.id DESC LIMIT 200`;
  const sessions = db.prepare(query).all(...params);

  const currently_in_lab = db.prepare(`
    SELECT b.*, u.name as employee_name, u.employee_id as emp_code, d.name as department_name
    FROM biometric_lab_attendance b
    JOIN users u ON b.employee_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE b.status = 'IN_LAB' AND b.out_time IS NULL
    ORDER BY b.in_time DESC
  `).all();

  const enrolled_employees = db.prepare(`
    SELECT fm.id, fm.device_id, fm.fingerprint_slot, fm.enrolled_at, fm.is_active,
           u.id as employee_id, u.name as employee_name, u.email, u.employee_id as emp_code, u.role,
           d.name as department_name,
           (SELECT status FROM biometric_lab_attendance bl WHERE bl.employee_id = u.id ORDER BY bl.id DESC LIMIT 1) as current_lab_status,
           (SELECT in_time FROM biometric_lab_attendance bl WHERE bl.employee_id = u.id ORDER BY bl.id DESC LIMIT 1) as last_lab_in,
           (SELECT out_time FROM biometric_lab_attendance bl WHERE bl.employee_id = u.id ORDER BY bl.id DESC LIMIT 1) as last_lab_out
    FROM fingerprint_mappings fm
    JOIN users u ON fm.employee_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE fm.is_active = 1
    ORDER BY fm.fingerprint_slot ASC
  `).all();

  const today = getTodayString();
  const todayCount = (db.prepare(`SELECT COUNT(*) as c FROM biometric_lab_attendance WHERE attendance_date = ?`).get(today) as any)?.c || 0;

  const recent_logs = db.prepare(`
    SELECT l.*, u.name as employee_name, u.employee_id as emp_code
    FROM biometric_scan_logs l
    LEFT JOIN users u ON l.employee_id = u.id
    ORDER BY l.id DESC LIMIT 30
  `).all();

  const pending_commands = db.prepare(`
    SELECT bc.*, u.name as employee_name
    FROM biometric_commands bc
    LEFT JOIN users u ON bc.employee_id = u.id
    WHERE bc.status IN ('PENDING', 'IN_PROGRESS')
    ORDER BY bc.id DESC LIMIT 10
  `).all();

  res.json({
    sessions,
    currently_in_lab,
    enrolled_employees,
    recent_logs,
    pending_commands,
    summary: {
      inside_now: currently_in_lab.length,
      entries_today: todayCount,
      enrolled_count: enrolled_employees.length
    }
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

    const empRow = db.prepare('SELECT name FROM users WHERE id = ?').get(Number(employee_id)) as any;
    db.prepare(`
      INSERT INTO biometric_scan_logs (event_id, device_id, fingerprint_slot, employee_id, action, message)
      VALUES (?, ?, ?, ?, 'ENROLL_QUEUED', ?)
    `).run(
      `${device_id}-ENROLL-Q-${queuedCommandId}`,
      device_id,
      Number(fingerprint_slot),
      Number(employee_id),
      `Enrollment requested for ${empRow?.name || 'Employee'} (UART Slot #${fingerprint_slot}) — waiting for finger on R307...`
    );
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
