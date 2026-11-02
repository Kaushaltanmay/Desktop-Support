import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// POST /api/feedback (Any employee / team member can submit feedback / grievance directly to HR)
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const {
    reported_against_id,
    category,
    severity = 'MEDIUM',
    subject,
    description,
    is_anonymous = 0
  } = req.body;

  if (!category || !subject || !description) {
    res.status(400).json({ error: 'Category, subject, and description are required.' });
    return;
  }

  const validCategories = [
    'NOISE_DISTURBANCE',
    'INTERPERSONAL_CONFLICT',
    'WORKPLACE_CONDUCT',
    'COMMUNICATION',
    'WORK_ALLOCATION',
    'FACILITIES_DESK',
    'OTHER'
  ];

  const cat = validCategories.includes(category) ? category : 'OTHER';

  const insertRes = db.prepare(`
    INSERT INTO team_feedback (
      reporter_id, reported_against_id, category, severity,
      subject, description, is_anonymous, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
  `).run(
    user.id,
    reported_against_id ? Number(reported_against_id) : null,
    cat,
    severity,
    subject.trim(),
    description.trim(),
    is_anonymous ? 1 : 0
  );

  const feedbackId = insertRes.lastInsertRowid;

  // Lookup reported against employee name if specified
  let targetName = 'General Workplace';
  if (reported_against_id) {
    const target = db.prepare("SELECT name FROM users WHERE id = ?").get(reported_against_id) as any;
    if (target) targetName = target.name;
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, user_id, action, new_value, description, ip_address)
    VALUES ('FEEDBACK', ?, ?, 'FEEDBACK_SUBMITTED', ?, ?, ?)
  `).run(
    feedbackId,
    user.id,
    cat,
    `Workplace grievance reported regarding ${targetName} (${is_anonymous ? 'Anonymous' : user.name})`,
    req.ip || '127.0.0.1'
  );

  // Dispatch High-Priority Notification to HR Leads & Admins
  const hrStaff = db.prepare("SELECT id FROM users WHERE role IN ('HR', 'ADMIN')").all() as any[];
  const notifStmt = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'HR_ALERT', ?, ?)
  `);

  for (const hr of hrStaff) {
    notifStmt.run(
      hr.id,
      'New Workplace Grievance Filed',
      `A team grievance has been reported: "${subject}" regarding ${targetName}. Category: ${cat}. Please review in the HR Portal.`
    );
  }

  res.status(201).json({
    message: 'Feedback submitted confidentially to HR. Thank you for helping keep our workplace respectful and productive.',
    feedbackId
  });
});

// GET /api/feedback (HR / Admin view all; Employees view their submitted feedback)
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isHR = user.role === 'HR' || user.role === 'ADMIN';

  let query = `
    SELECT fb.*,
           target.name as reported_against_name, target.email as reported_against_email,
           d.name as reported_against_department,
           reviewer.name as reviewer_name,
           CASE 
             WHEN fb.is_anonymous = 1 AND ? = 0 THEN 'Anonymous Employee'
             ELSE reporter.name
           END as reporter_name,
           CASE
             WHEN fb.is_anonymous = 1 AND ? = 0 THEN 'confidential@flymedia.com'
             ELSE reporter.email
           END as reporter_email
    FROM team_feedback fb
    LEFT JOIN users reporter ON fb.reporter_id = reporter.id
    LEFT JOIN users target ON fb.reported_against_id = target.id
    LEFT JOIN departments d ON target.department_id = d.id
    LEFT JOIN users reviewer ON fb.reviewed_by = reviewer.id
    WHERE 1=1
  `;
  const params: any[] = [isHR ? 1 : 0, isHR ? 1 : 0];

  // If not HR, only see own submitted feedback
  if (!isHR) {
    query += ` AND fb.reporter_id = ?`;
    params.push(user.id);
  }

  query += ` ORDER BY fb.created_at DESC`;

  const feedbacks = db.prepare(query).all(...params);
  res.json({ feedbacks });
});

// PATCH /api/feedback/:id (HR / Admin can update grievance status and internal review notes)
router.patch('/:id', authenticateToken, requireRole(['HR', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const hrUser = req.user!;
  const feedbackId = Number(req.params.id);
  const { status, hr_notes } = req.body;

  const fb = db.prepare("SELECT * FROM team_feedback WHERE id = ?").get(feedbackId) as any;
  if (!fb) {
    res.status(404).json({ error: 'Feedback record not found.' });
    return;
  }

  const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'ACTION_TAKEN', 'RESOLVED', 'DISMISSED'];
  const newStatus = validStatuses.includes(status) ? status : fb.status;

  db.prepare(`
    UPDATE team_feedback
    SET status = ?,
        hr_notes = COALESCE(?, hr_notes),
        reviewed_by = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, hr_notes || null, hrUser.id, feedbackId);

  // Notify reporter if not anonymous and status changed
  if (fb.reporter_id && fb.is_anonymous === 0 && newStatus !== fb.status) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, 'HR_UPDATE', 'Grievance Review Update', ?)
    `).run(
      fb.reporter_id,
      `Your submitted feedback (#${feedbackId} - "${fb.subject}") status has been updated to "${newStatus}" by HR.`
    );
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, user_id, action, new_value, description, ip_address)
    VALUES ('FEEDBACK', ?, ?, 'FEEDBACK_REVIEWED', ?, ?, ?)
  `).run(
    feedbackId,
    hrUser.id,
    newStatus,
    `Grievance #${feedbackId} reviewed by ${hrUser.name}. Status: ${newStatus}`,
    req.ip || '127.0.0.1'
  );

  res.json({ message: 'Feedback updated successfully.' });
});

export default router;

