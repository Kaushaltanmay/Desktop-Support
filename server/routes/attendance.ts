import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { isWithinOfficeRadius } from '../utils/geo';
import { calculateLateMinutes, calculateAttendanceMetrics, formatMinutes, DEFAULT_SCHEDULE } from '../utils/attendanceCalc';

const router = Router();

// Helper to get formatted current date YYYY-MM-DD
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// -------------------------------------------------------------
// POST /api/attendance/punch-in
// -------------------------------------------------------------
router.post('/punch-in', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { latitude, longitude, accuracy, device_information } = req.body;

  if (latitude === undefined || longitude === undefined) {
    res.status(400).json({ error: 'GPS coordinates (latitude and longitude) are required to punch in.' });
    return;
  }

  // 1. Fetch employee's assigned office
  const employee = db.prepare(`
    SELECT u.*, o.latitude as office_lat, o.longitude as office_lon, o.allowed_radius_meters, o.office_name,
           ws.start_time, ws.grace_period_minutes
    FROM users u
    LEFT JOIN offices o ON u.office_id = o.id
    LEFT JOIN work_schedules ws ON u.work_schedule_id = ws.id
    WHERE u.id = ?
  `).get(user.id) as any;

  if (!employee || !employee.office_lat || !employee.office_lon) {
    res.status(400).json({ error: 'Assigned office location configuration not found. Please contact HR.' });
    return;
  }

  // 2. Server-side Haversine verification (Strict 500m boundary)
  const allowedRadius = employee.allowed_radius_meters || 500;
  const radiusCheck = isWithinOfficeRadius(
    Number(latitude),
    Number(longitude),
    Number(employee.office_lat),
    Number(employee.office_lon),
    allowedRadius
  );

  if (!radiusCheck.isWithin) {
    res.status(400).json({
      error: `Attendance can only be marked within ${allowedRadius} meters of the office. (You are ${radiusCheck.distanceMeters}m away from ${employee.office_name})`,
      distanceMeters: radiusCheck.distanceMeters,
      allowedRadiusMeters: allowedRadius
    });
    return;
  }

  // 3. Single Punch-In Rule per day
  const today = getTodayString();
  const existing = db.prepare("SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?").get(user.id, today) as any;

  if (existing && existing.punch_in_at) {
    res.status(400).json({ error: 'You have already punched in today.' });
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // 4. Calculate late arrival beyond grace period (e.g. after 09:40)
  const lateMinutes = calculateLateMinutes(
    now,
    employee.start_time || DEFAULT_SCHEDULE.start_time,
    employee.grace_period_minutes ?? DEFAULT_SCHEDULE.grace_period_minutes
  );

  let attendanceId: number;

  if (existing) {
    db.prepare(`
      UPDATE attendance
      SET punch_in_at = ?, punch_in_latitude = ?, punch_in_longitude = ?, punch_in_accuracy = ?,
          late_minutes = ?, status = 'WORKING', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nowIso, latitude, longitude, accuracy || null, lateMinutes, existing.id);
    attendanceId = existing.id;
  } else {
    const insertRes = db.prepare(`
      INSERT INTO attendance (
        employee_id, office_id, work_schedule_id, attendance_date,
        punch_in_at, punch_in_latitude, punch_in_longitude, punch_in_accuracy,
        late_minutes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'WORKING')
    `).run(
      user.id,
      employee.office_id || 1,
      employee.work_schedule_id || 1,
      today,
      nowIso,
      latitude,
      longitude,
      accuracy || null,
      lateMinutes
    );
    attendanceId = Number(insertRes.lastInsertRowid);
  }

  // 5. Record immutable attendance event (Section 33)
  db.prepare(`
    INSERT INTO attendance_events (
      employee_id, attendance_id, event_type, latitude, longitude, accuracy,
      office_id, distance_from_office, device_information
    ) VALUES (?, ?, 'PUNCH_IN', ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    attendanceId,
    latitude,
    longitude,
    accuracy || null,
    employee.office_id || 1,
    radiusCheck.distanceMeters,
    device_information || null
  );

  // 6. Record immutable audit log
  db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, user_id, action, new_value, description)
    VALUES ('ATTENDANCE', ?, ?, 'ATTENDANCE_PUNCH_IN', ?, ?)
  `).run(
    attendanceId,
    user.id,
    nowIso,
    `${user.name} punched in at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${radiusCheck.distanceMeters}m from office)`
  );

  const updatedAttendance = db.prepare("SELECT * FROM attendance WHERE id = ?").get(attendanceId) as any;

  res.status(200).json({
    message: `Punched in successfully at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    attendance: updatedAttendance,
    distanceMeters: radiusCheck.distanceMeters,
    lateMinutes
  });
});

// -------------------------------------------------------------
// POST /api/attendance/punch-out
// -------------------------------------------------------------
router.post('/punch-out', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { latitude, longitude, accuracy, device_information } = req.body;

  if (latitude === undefined || longitude === undefined) {
    res.status(400).json({ error: 'GPS coordinates (latitude and longitude) are required to punch out.' });
    return;
  }

  const today = getTodayString();
  const attendance = db.prepare(`
    SELECT a.*, o.latitude as office_lat, o.longitude as office_lon, o.allowed_radius_meters, o.office_name,
           ws.expected_hours, ws.standard_daily_minutes, ws.full_day_min_hours, ws.half_day_min_hours
    FROM attendance a
    LEFT JOIN offices o ON a.office_id = o.id
    LEFT JOIN work_schedules ws ON a.work_schedule_id = ws.id
    WHERE a.employee_id = ? AND a.attendance_date = ?
  `).get(user.id, today) as any;

  if (!attendance || !attendance.punch_in_at) {
    res.status(400).json({ error: 'Cannot punch out without an active punch in.' });
    return;
  }

  if (attendance.punch_out_at) {
    res.status(400).json({ error: 'You have already punched out today.' });
    return;
  }

  // Server-side location verification
  const allowedRadius = attendance.allowed_radius_meters || 500;
  const radiusCheck = isWithinOfficeRadius(
    Number(latitude),
    Number(longitude),
    Number(attendance.office_lat),
    Number(attendance.office_lon),
    allowedRadius
  );

  if (!radiusCheck.isWithin) {
    res.status(400).json({
      error: `Attendance can only be marked within ${allowedRadius} meters of the office. (You are ${radiusCheck.distanceMeters}m away from ${attendance.office_name})`,
      distanceMeters: radiusCheck.distanceMeters,
      allowedRadiusMeters: allowedRadius
    });
    return;
  }

  const punchInTime = new Date(attendance.punch_in_at);
  const now = new Date();
  const nowIso = now.toISOString();

  // Calculate working hours, overtime, and final status
  const schedule = {
    start_time: '09:30',
    end_time: '18:30',
    grace_period_minutes: 10,
    expected_hours: attendance.expected_hours || 9.0,
    half_day_min_hours: attendance.half_day_min_hours || 4.0,
    full_day_min_hours: attendance.full_day_min_hours || 8.0,
    standard_daily_minutes: attendance.standard_daily_minutes || 540
  };

  const metrics = calculateAttendanceMetrics(punchInTime, now, schedule);

  db.prepare(`
    UPDATE attendance
    SET punch_out_at = ?, punch_out_latitude = ?, punch_out_longitude = ?, punch_out_accuracy = ?,
        total_work_minutes = ?, regular_work_minutes = ?, overtime_minutes = ?,
        status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    nowIso,
    latitude,
    longitude,
    accuracy || null,
    metrics.totalWorkMinutes,
    metrics.regularWorkMinutes,
    metrics.overtimeMinutes,
    metrics.status,
    attendance.id
  );

  // Record immutable attendance event
  db.prepare(`
    INSERT INTO attendance_events (
      employee_id, attendance_id, event_type, latitude, longitude, accuracy,
      office_id, distance_from_office, device_information
    ) VALUES (?, ?, 'PUNCH_OUT', ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    attendance.id,
    latitude,
    longitude,
    accuracy || null,
    attendance.office_id || 1,
    radiusCheck.distanceMeters,
    device_information || null
  );

  // Record immutable audit log
  db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, user_id, action, new_value, description)
    VALUES ('ATTENDANCE', ?, ?, 'ATTENDANCE_PUNCH_OUT', ?, ?)
  `).run(
    attendance.id,
    user.id,
    nowIso,
    `${user.name} punched out at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Total: ${formatMinutes(metrics.totalWorkMinutes)}, Status: ${metrics.status}`
  );

  const finalRecord = db.prepare("SELECT * FROM attendance WHERE id = ?").get(attendance.id) as any;

  res.status(200).json({
    message: `Punched out successfully. Working duration: ${formatMinutes(metrics.totalWorkMinutes)}. Status: ${metrics.status}.`,
    attendance: finalRecord,
    totalWorkMinutes: metrics.totalWorkMinutes,
    formattedWorkHours: formatMinutes(metrics.totalWorkMinutes),
    formattedOvertime: formatMinutes(metrics.overtimeMinutes),
    status: metrics.status,
    distanceMeters: radiusCheck.distanceMeters
  });
});

// -------------------------------------------------------------
// GET /api/attendance/today (Current user's today attendance status)
// -------------------------------------------------------------
router.get('/today', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const today = getTodayString();

  const record = db.prepare(`
    SELECT a.*, o.office_name, o.latitude as office_lat, o.longitude as office_lon, o.allowed_radius_meters,
           ws.schedule_name, ws.start_time, ws.end_time
    FROM attendance a
    LEFT JOIN offices o ON a.office_id = o.id
    LEFT JOIN work_schedules ws ON a.work_schedule_id = ws.id
    WHERE a.employee_id = ? AND a.attendance_date = ?
  `).get(user.id, today) as any;

  const office = db.prepare(`
    SELECT o.* FROM users u
    JOIN offices o ON u.office_id = o.id
    WHERE u.id = ?
  `).get(user.id) as any;

  res.json({
    today,
    attendance: record || null,
    office: office || null,
    workingStatus: !record ? 'NOT_PUNCHED' : record.punch_out_at ? 'PUNCHED_OUT' : 'WORKING'
  });
});

// -------------------------------------------------------------
// GET /api/attendance/me (Employee's Attendance History & Summary)
// -------------------------------------------------------------
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7); // YYYY-MM

  const records = db.prepare(`
    SELECT a.*, o.office_name
    FROM attendance a
    LEFT JOIN offices o ON a.office_id = o.id
    WHERE a.employee_id = ? AND a.attendance_date LIKE ?
    ORDER BY a.attendance_date DESC
  `).all(user.id, `${month}%`) as any[];

  // Monthly summary calculations
  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const halfDayCount = records.filter(r => r.status === 'HALF_DAY').length;
  const leaveCount = records.filter(r => r.status === 'LEAVE').length;
  const absentCount = records.filter(r => r.status === 'ABSENT').length;
  const totalOvertimeMinutes = records.reduce((sum, r) => sum + (r.overtime_minutes || 0), 0);

  res.json({
    month,
    summary: {
      presentDays: presentCount,
      halfDays: halfDayCount,
      leaveDays: leaveCount,
      absentDays: absentCount,
      overtimeMinutes: totalOvertimeMinutes,
      overtimeFormatted: formatMinutes(totalOvertimeMinutes),
      totalLoggedDays: records.length
    },
    records: records.map(r => ({
      ...r,
      total_work_formatted: formatMinutes(r.total_work_minutes),
      overtime_formatted: formatMinutes(r.overtime_minutes)
    }))
  });
});

// -------------------------------------------------------------
// GET /api/attendance (HR / Admin view all attendance)
// -------------------------------------------------------------
router.get('/', authenticateToken, requireRole(['HR', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { date, employee_id, department_id, status, search } = req.query;

  let query = `
    SELECT a.*, u.name as employee_name, u.email as employee_email, u.employee_id as emp_code,
           d.name as department_name, o.office_name, o.latitude as office_lat, o.longitude as office_lon
    FROM attendance a
    JOIN users u ON a.employee_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN offices o ON a.office_id = o.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (date) {
    query += ` AND a.attendance_date = ?`;
    params.push(date);
  }

  if (employee_id) {
    query += ` AND a.employee_id = ?`;
    params.push(employee_id);
  }

  if (department_id && department_id !== 'all') {
    query += ` AND u.department_id = ?`;
    params.push(department_id);
  }

  if (status && status !== 'all') {
    query += ` AND a.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (u.name LIKE ? OR u.employee_id LIKE ? OR u.email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY a.attendance_date DESC, a.created_at DESC LIMIT 100`;

  const records = db.prepare(query).all(...params) as any[];

  res.json({
    records: records.map(r => ({
      ...r,
      total_work_formatted: formatMinutes(r.total_work_minutes),
      overtime_formatted: formatMinutes(r.overtime_minutes)
    }))
  });
});

// -------------------------------------------------------------
// GET /api/attendance/:id (Single detailed attendance record)
// -------------------------------------------------------------
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const record = db.prepare(`
    SELECT a.*, u.name as employee_name, u.email as employee_email, u.employee_id as emp_code,
           d.name as department_name, o.office_name, o.latitude as office_lat, o.longitude as office_lon,
           o.allowed_radius_meters
    FROM attendance a
    JOIN users u ON a.employee_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN offices o ON a.office_id = o.id
    WHERE a.id = ?
  `).get(req.params.id) as any;

  if (!record) {
    res.status(404).json({ error: 'Attendance record not found.' });
    return;
  }

  // Non-HR/Admin users can only view their own record
  if (req.user!.role === 'EMPLOYEE' && record.employee_id !== req.user!.id) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  const events = db.prepare(`
    SELECT * FROM attendance_events WHERE attendance_id = ? ORDER BY timestamp ASC
  `).all(record.id) as any[];

  res.json({
    record: {
      ...record,
      total_work_formatted: formatMinutes(record.total_work_minutes),
      overtime_formatted: formatMinutes(record.overtime_minutes)
    },
    events
  });
});

// -------------------------------------------------------------
// PATCH /api/attendance/:id/correct (HR manual correction with audit log)
// -------------------------------------------------------------
router.patch('/:id/correct', authenticateToken, requireRole(['HR', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const hrUser = req.user!;
  const attendanceId = req.params.id;
  const { punch_in_at, punch_out_at, status, reason } = req.body;

  if (!reason || !reason.trim()) {
    res.status(400).json({ error: 'A justification reason is required for manual attendance corrections.' });
    return;
  }

  const existing = db.prepare("SELECT * FROM attendance WHERE id = ?").get(attendanceId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Attendance record not found.' });
    return;
  }

  const newPunchIn = punch_in_at || existing.punch_in_at;
  const newPunchOut = punch_out_at || existing.punch_out_at;
  let newStatus = status || existing.status;

  // Recalculate metrics if times were modified
  let totalWorkMinutes = existing.total_work_minutes;
  let regularWorkMinutes = existing.regular_work_minutes;
  let overtimeMinutes = existing.overtime_minutes;

  if (newPunchIn && newPunchOut) {
    const pIn = new Date(newPunchIn);
    const pOut = new Date(newPunchOut);
    const metrics = calculateAttendanceMetrics(pIn, pOut);
    totalWorkMinutes = metrics.totalWorkMinutes;
    regularWorkMinutes = metrics.regularWorkMinutes;
    overtimeMinutes = metrics.overtimeMinutes;
    if (!status) newStatus = metrics.status;
  }

  db.prepare(`
    UPDATE attendance
    SET punch_in_at = ?, punch_out_at = ?, total_work_minutes = ?, regular_work_minutes = ?,
        overtime_minutes = ?, status = ?, is_corrected = 1, correction_reason = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    newPunchIn,
    newPunchOut,
    totalWorkMinutes,
    regularWorkMinutes,
    overtimeMinutes,
    newStatus,
    reason,
    attendanceId
  );

  // Record immutable audit log
  const auditDesc = `HR ${hrUser.name} corrected attendance #${attendanceId} (Status: ${existing.status} -> ${newStatus}). Reason: ${reason}`;
  db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, user_id, action, old_value, new_value, description)
    VALUES ('ATTENDANCE', ?, ?, 'ATTENDANCE_CORRECTED', ?, ?, ?)
  `).run(
    attendanceId,
    hrUser.id,
    JSON.stringify({ status: existing.status, punch_in: existing.punch_in_at, punch_out: existing.punch_out_at }),
    JSON.stringify({ status: newStatus, punch_in: newPunchIn, punch_out: newPunchOut, reason }),
    auditDesc
  );

  // Send in-app notification to employee
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'ATTENDANCE_CORRECTED', 'Attendance Record Adjusted', ?)
  `).run(
    existing.employee_id,
    `Your attendance for ${existing.attendance_date} was updated by HR: ${reason}`
  );

  res.json({
    message: 'Attendance record corrected successfully.',
    attendanceId,
    newStatus
  });
});

export default router;
