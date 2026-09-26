import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper to calculate business/calendar days between two dates
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

// -------------------------------------------------------------
// GET /api/leaves/types
// -------------------------------------------------------------
router.get('/types', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const types = db.prepare("SELECT * FROM leave_types WHERE is_active = 1").all();
  res.json({ types });
});

// -------------------------------------------------------------
// GET /api/leaves/balances (Current employee's leave balance)
// -------------------------------------------------------------
router.get('/balances', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const currentYear = new Date().getFullYear();

  const balances = db.prepare(`
    SELECT lb.*, lt.name as leave_type_name, lt.code as leave_type_code
    FROM leave_balances lb
    JOIN leave_types lt ON lb.leave_type_id = lt.id
    WHERE lb.employee_id = ? AND lb.year = ?
  `).all(user.id, currentYear) as any[];

  res.json({ year: currentYear, balances });
});

// -------------------------------------------------------------
// POST /api/leaves/apply (Apply for leave)
// -------------------------------------------------------------
router.post('/apply', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { leave_type_id, start_date, end_date, reason, attachment_url } = req.body;

  if (!leave_type_id || !start_date || !end_date || !reason) {
    res.status(400).json({ error: 'Please provide leave type, start date, end date, and reason.' });
    return;
  }

  if (new Date(start_date) > new Date(end_date)) {
    res.status(400).json({ error: 'End date cannot be earlier than start date.' });
    return;
  }

  const numberOfDays = calculateDays(start_date, end_date);

  // Check leave balance
  const currentYear = new Date().getFullYear();
  const balance = db.prepare(`
    SELECT * FROM leave_balances
    WHERE employee_id = ? AND leave_type_id = ? AND year = ?
  `).get(user.id, leave_type_id, currentYear) as any;

  if (balance && balance.remaining_days < numberOfDays) {
    res.status(400).json({
      error: `Insufficient leave balance. You have ${balance.remaining_days} days remaining, but requested ${numberOfDays} days.`
    });
    return;
  }

  const insertRes = db.prepare(`
    INSERT INTO leave_requests (
      employee_id, leave_type_id, start_date, end_date, number_of_days, reason, attachment_url, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(
    user.id,
    leave_type_id,
    start_date,
    end_date,
    numberOfDays,
    reason,
    attachment_url || null
  );

  const requestId = Number(insertRes.lastInsertRowid);

  // Record immutable audit log
  db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, user_id, action, new_value, description)
    VALUES ('LEAVE', ?, ?, 'LEAVE_APPLIED', ?, ?)
  `).run(
    requestId,
    user.id,
    JSON.stringify({ start_date, end_date, number_of_days: numberOfDays, reason }),
    `${user.name} applied for ${numberOfDays} day(s) leave from ${start_date} to ${end_date}`
  );

  // Notify HR staff
  const hrStaff = db.prepare("SELECT id FROM users WHERE role IN ('HR', 'ADMIN')").all() as any[];
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'LEAVE_REQUEST', 'New Leave Request', ?)
  `);
  for (const hr of hrStaff) {
    insertNotif.run(hr.id, `${user.name} submitted a leave request (${numberOfDays} days) for review.`);
  }

  res.status(201).json({
    message: 'Leave application submitted successfully.',
    requestId,
    numberOfDays
  });
});

// -------------------------------------------------------------
// GET /api/leaves (List leave requests)
// -------------------------------------------------------------
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isHR = user.role === 'HR' || user.role === 'ADMIN';
  const { status, employee_id } = req.query;

  let query = `
    SELECT lr.*, u.name as employee_name, u.email as employee_email, u.employee_id as emp_code,
           d.name as department_name, lt.name as leave_type_name, lt.code as leave_type_code,
           reviewer.name as reviewer_name
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    LEFT JOIN users reviewer ON lr.reviewed_by = reviewer.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Scoping: Employees only see their own requests
  if (!isHR) {
    query += ` AND lr.employee_id = ?`;
    params.push(user.id);
  } else if (employee_id) {
    query += ` AND lr.employee_id = ?`;
    params.push(employee_id);
  }

  if (status && status !== 'all') {
    query += ` AND lr.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY lr.applied_at DESC`;

  const leaves = db.prepare(query).all(...params) as any[];

  res.json({ leaves });
});

// -------------------------------------------------------------
// PATCH /api/leaves/:id/approve (HR Approve Leave)
// -------------------------------------------------------------
router.patch('/:id/approve', authenticateToken, requireRole(['HR', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const hrUser = req.user!;
  const requestId = req.params.id;
  const { review_comment } = req.body;

  const request = db.prepare(`
    SELECT lr.*, u.name as employee_name
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    WHERE lr.id = ?
  `).get(requestId) as any;

  if (!request) {
    res.status(404).json({ error: 'Leave request not found.' });
    return;
  }

  if (request.status !== 'PENDING') {
    res.status(400).json({ error: `Cannot approve request that is already ${request.status}.` });
    return;
  }

  // Deduct from leave balance
  const currentYear = new Date().getFullYear();
  db.prepare(`
    UPDATE leave_balances
    SET used_days = used_days + ?,
        remaining_days = remaining_days - ?
    WHERE employee_id = ? AND leave_type_id = ? AND year = ?
  `).run(request.number_of_days, request.number_of_days, request.employee_id, request.leave_type_id, currentYear);

  // Update request status
  db.prepare(`
    UPDATE leave_requests
    SET status = 'APPROVED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?,
        review_comment = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(hrUser.id, review_comment || 'Approved by HR', requestId);

  // Record immutable audit log
  db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, user_id, action, old_value, new_value, description)
    VALUES ('LEAVE', ?, ?, 'LEAVE_APPROVED', 'PENDING', 'APPROVED', ?)
  `).run(
    requestId,
    hrUser.id,
    `HR ${hrUser.name} approved leave request #${requestId} for ${request.employee_name} (${request.number_of_days} days)`
  );

  // Notify employee
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'LEAVE_APPROVED', 'Leave Request Approved', ?)
  `).run(
    request.employee_id,
    `Your leave request from ${request.start_date} to ${request.end_date} has been approved by HR.`
  );

  res.json({ message: 'Leave request approved successfully.' });
});

// -------------------------------------------------------------
// PATCH /api/leaves/:id/reject (HR Reject Leave)
// -------------------------------------------------------------
router.patch('/:id/reject', authenticateToken, requireRole(['HR', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const hrUser = req.user!;
  const requestId = req.params.id;
  const { review_comment } = req.body;

  const request = db.prepare(`
    SELECT lr.*, u.name as employee_name
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    WHERE lr.id = ?
  `).get(requestId) as any;

  if (!request) {
    res.status(404).json({ error: 'Leave request not found.' });
    return;
  }

  if (request.status !== 'PENDING') {
    res.status(400).json({ error: `Cannot reject request that is already ${request.status}.` });
    return;
  }

  db.prepare(`
    UPDATE leave_requests
    SET status = 'REJECTED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?,
        review_comment = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(hrUser.id, review_comment || 'Rejected by HR', requestId);

  // Record immutable audit log
  db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, user_id, action, old_value, new_value, description)
    VALUES ('LEAVE', ?, ?, 'LEAVE_REJECTED', 'PENDING', 'REJECTED', ?)
  `).run(
    requestId,
    hrUser.id,
    `HR ${hrUser.name} rejected leave request #${requestId} for ${request.employee_name}. Reason: ${review_comment || 'No reason specified'}`
  );

  // Notify employee
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'LEAVE_REJECTED', 'Leave Request Rejected', ?)
  `).run(
    request.employee_id,
    `Your leave request from ${request.start_date} to ${request.end_date} was rejected by HR. ${review_comment ? `Note: ${review_comment}` : ''}`
  );

  res.json({ message: 'Leave request rejected.' });
});

export default router;
