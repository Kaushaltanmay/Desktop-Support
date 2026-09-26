import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

// GET /api/tickets
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { status, priority, category, department_id, assigned_to, search, sort = 'newest' } = req.query;

  let query = `
    SELECT t.*,
           creator.name as creator_name, creator.email as creator_email, creator.employee_id as creator_employee_id,
           assignee.name as assignee_name, assignee.email as assignee_email,
           d.name as department_name,
           dev.asset_tag, dev.device_name, dev.model as device_model,
           (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) as comment_count
    FROM tickets t
    JOIN users creator ON t.created_by = creator.id
    LEFT JOIN users assignee ON t.assigned_to = assignee.id
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN devices dev ON t.device_id = dev.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Role-based scoping: Employees can ONLY see their own tickets
  if (user.role === 'EMPLOYEE') {
    query += ` AND t.created_by = ?`;
    params.push(user.id);
  }

  // Filters
  if (status && status !== 'all') {
    query += ` AND t.status = ?`;
    params.push(status);
  }

  if (priority && priority !== 'all') {
    query += ` AND t.priority = ?`;
    params.push(priority);
  }

  if (category && category !== 'all') {
    query += ` AND t.category = ?`;
    params.push(category);
  }

  if (department_id && department_id !== 'all') {
    query += ` AND t.department_id = ?`;
    params.push(department_id);
  }

  if (assigned_to && assigned_to !== 'all') {
    if (assigned_to === 'unassigned') {
      query += ` AND t.assigned_to IS NULL`;
    } else {
      query += ` AND t.assigned_to = ?`;
      params.push(assigned_to);
    }
  }

  if (search) {
    query += ` AND (
      t.ticket_number LIKE ? OR 
      t.subject LIKE ? OR 
      t.description LIKE ? OR 
      creator.name LIKE ? OR 
      dev.asset_tag LIKE ?
    )`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  // Sorting
  if (sort === 'oldest') {
    query += ` ORDER BY t.created_at ASC`;
  } else if (sort === 'priority') {
    query += ` ORDER BY CASE t.priority 
      WHEN 'CRITICAL' THEN 1 
      WHEN 'HIGH' THEN 2 
      WHEN 'MEDIUM' THEN 3 
      WHEN 'LOW' THEN 4 END ASC, t.created_at DESC`;
  } else if (sort === 'updated') {
    query += ` ORDER BY t.updated_at DESC`;
  } else {
    query += ` ORDER BY t.created_at DESC`; // newest default
  }

  const tickets = db.prepare(query).all(...params) as any[];

  // Format resolution time strings
  const formattedTickets = tickets.map(t => ({
    ...t,
    resolution_time_formatted: t.resolution_time_seconds ? formatDuration(t.resolution_time_seconds) : null
  }));

  res.json({ tickets: formattedTickets });
});

// POST /api/tickets (Raise Ticket)
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { category, priority, subject, description, device_id, attachment_url } = req.body;

  if (!category || !priority || !subject || !description) {
    res.status(400).json({ error: 'Category, priority, subject, and description are required.' });
    return;
  }

  // Generate next unique ticket number (e.g. IT-1001, IT-1028)
  const lastTicket = db.prepare("SELECT ticket_number FROM tickets ORDER BY id DESC LIMIT 1").get() as any;
  let nextNumber = 1001;
  if (lastTicket && lastTicket.ticket_number) {
    const match = lastTicket.ticket_number.match(/IT-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }
  const ticketNumber = `IT-${nextNumber}`;

  // Automatically lookup user device if not explicitly provided
  let resolvedDeviceId = device_id;
  if (!resolvedDeviceId) {
    const userDevice = db.prepare("SELECT id FROM devices WHERE employee_id = ? LIMIT 1").get(user.id) as any;
    if (userDevice) resolvedDeviceId = userDevice.id;
  }

  const insertStmt = db.prepare(`
    INSERT INTO tickets (ticket_number, created_by, department_id, category, priority, status, subject, description, device_id, attachment_url)
    VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?)
  `);

  const info = insertStmt.run(
    ticketNumber,
    user.id,
    user.department_id || null,
    category,
    priority,
    subject.trim(),
    description.trim(),
    resolvedDeviceId || null,
    attachment_url || null
  );

  const ticketId = info.lastInsertRowid;

  // Record initial status history
  db.prepare(`
    INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by)
    VALUES (?, NULL, 'OPEN', ?)
  `).run(ticketId, user.id);

  // Record audit log
  db.prepare(`
    INSERT INTO audit_logs (ticket_id, user_id, action, old_value, new_value, description, ip_address)
    VALUES (?, ?, 'TICKET_CREATED', NULL, 'OPEN', ?, ?)
  `).run(ticketId, user.id, `Ticket #${ticketNumber} created by ${user.name}`, req.ip || '127.0.0.1');

  // Notify IT Engineers
  const itEngineers = db.prepare("SELECT id FROM users WHERE role IN ('IT_ENGINEER', 'ADMIN')").all() as any[];
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, ticket_id, type, title, message)
    VALUES (?, ?, 'NEW_TICKET', 'New Ticket Raised', ?)
  `);
  itEngineers.forEach(eng => {
    insertNotif.run(eng.id, ticketId, `${user.name} raised ticket #${ticketNumber}: "${subject}"`);
  });

  const createdTicket = db.prepare(`
    SELECT t.*, u.name as creator_name, d.name as department_name, dev.asset_tag
    FROM tickets t
    JOIN users u ON t.created_by = u.id
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN devices dev ON t.device_id = dev.id
    WHERE t.id = ?
  `).get(ticketId);

  res.status(201).json({
    message: 'Ticket raised successfully',
    ticketNumber,
    ticket: createdTicket
  });
});

// GET /api/tickets/:id
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const ticketId = req.params.id;

  const ticket = db.prepare(`
    SELECT t.*,
           creator.name as creator_name, creator.email as creator_email, creator.employee_id as creator_employee_id, creator.phone as creator_phone,
           assignee.name as assignee_name, assignee.email as assignee_email,
           resolver.name as resolver_name,
           d.name as department_name,
           dev.asset_tag, dev.device_name, dev.model as device_model, dev.cpu, dev.ram, dev.storage, dev.operating_system, dev.ip_address as device_ip
    FROM tickets t
    JOIN users creator ON t.created_by = creator.id
    LEFT JOIN users assignee ON t.assigned_to = assignee.id
    LEFT JOIN users resolver ON t.resolved_by = resolver.id
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN devices dev ON t.device_id = dev.id
    WHERE t.id = ? OR t.ticket_number = ?
  `).get(ticketId, ticketId) as any;

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  // Employee access check
  if (user.role === 'EMPLOYEE' && ticket.created_by !== user.id) {
    res.status(403).json({ error: 'Forbidden. You can only view your own tickets.' });
    return;
  }

  // Comments
  const comments = db.prepare(`
    SELECT tc.*, u.name as author_name, u.role as author_role
    FROM ticket_comments tc
    JOIN users u ON tc.user_id = u.id
    WHERE tc.ticket_id = ?
    ORDER BY tc.created_at ASC
  `).all(ticket.id);

  // Status History
  const history = db.prepare(`
    SELECT tsh.*, u.name as changed_by_name
    FROM ticket_status_history tsh
    JOIN users u ON tsh.changed_by = u.id
    WHERE tsh.ticket_id = ?
    ORDER BY tsh.created_at ASC
  `).all(ticket.id);

  // Audit timeline
  const audits = db.prepare(`
    SELECT a.*, u.name as user_name, u.role as user_role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.ticket_id = ?
    ORDER BY a.created_at ASC
  `).all(ticket.id);

  res.json({
    ticket: {
      ...ticket,
      resolution_time_formatted: ticket.resolution_time_seconds ? formatDuration(ticket.resolution_time_seconds) : null
    },
    comments,
    history,
    audits
  });
});

// POST /api/tickets/:id/comments
router.post('/:id/comments', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const ticketId = req.params.id;
  const { comment, is_internal = 0 } = req.body;

  if (!comment || !comment.trim()) {
    res.status(400).json({ error: 'Comment text is required.' });
    return;
  }

  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ? OR ticket_number = ?").get(ticketId, ticketId) as any;
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  if (user.role === 'EMPLOYEE' && ticket.created_by !== user.id) {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }

  const info = db.prepare(`
    INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal)
    VALUES (?, ?, ?, ?)
  `).run(ticket.id, user.id, comment.trim(), is_internal ? 1 : 0);

  // Update ticket updated_at
  db.prepare("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ticket.id);

  const action = user.role === 'EMPLOYEE' ? 'COMMENT_ADDED' : 'ENGINEER_REPLIED';
  db.prepare(`
    INSERT INTO audit_logs (ticket_id, user_id, action, description, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(ticket.id, user.id, action, `${user.name} added a ${user.role === 'EMPLOYEE' ? 'reply' : 'response'}: "${comment.substring(0, 60)}..."`, req.ip || '127.0.0.1');

  // Notify recipient
  const recipientId = user.role === 'EMPLOYEE' ? ticket.assigned_to : ticket.created_by;
  if (recipientId) {
    db.prepare(`
      INSERT INTO notifications (user_id, ticket_id, type, title, message)
      VALUES (?, ?, 'TICKET_REPLY', 'New Reply on Ticket', ?)
    `).run(recipientId, ticket.id, `${user.name} commented on ticket #${ticket.ticket_number}`);
  }

  res.status(201).json({
    message: 'Comment added successfully',
    comment: {
      id: info.lastInsertRowid,
      ticket_id: ticket.id,
      user_id: user.id,
      author_name: user.name,
      author_role: user.role,
      comment: comment.trim(),
      created_at: new Date().toISOString()
    }
  });
});

// POST /api/tickets/:id/assign
router.post('/:id/assign', authenticateToken, requireRole(['IT_ENGINEER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const ticketId = req.params.id;
  const { assigned_to } = req.body;

  if (!assigned_to) {
    res.status(400).json({ error: 'Assigned engineer ID is required.' });
    return;
  }

  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ? OR ticket_number = ?").get(ticketId, ticketId) as any;
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  const engineer = db.prepare("SELECT * FROM users WHERE id = ? AND role IN ('IT_ENGINEER', 'ADMIN')").get(assigned_to) as any;
  if (!engineer) {
    res.status(400).json({ error: 'Invalid engineer selected.' });
    return;
  }

  const now = new Date().toISOString();

  // If status is OPEN, automatically transition to IN PROGRESS upon assignment
  let newStatus = ticket.status;
  if (ticket.status === 'OPEN') {
    newStatus = 'IN PROGRESS';
    db.prepare(`
      INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by)
      VALUES (?, 'OPEN', 'IN PROGRESS', ?)
    `).run(ticket.id, user.id);
  }

  db.prepare(`
    UPDATE tickets 
    SET assigned_to = ?, assigned_at = CURRENT_TIMESTAMP, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(engineer.id, newStatus, ticket.id);

  db.prepare(`
    INSERT INTO ticket_assignments (ticket_id, assigned_to, assigned_by)
    VALUES (?, ?, ?)
  `).run(ticket.id, engineer.id, user.id);

  db.prepare(`
    INSERT INTO audit_logs (ticket_id, user_id, action, old_value, new_value, description, ip_address)
    VALUES (?, ?, 'TICKET_ASSIGNED', ?, ?, ?, ?)
  `).run(ticket.id, user.id, ticket.assigned_to ? String(ticket.assigned_to) : null, engineer.name, `Ticket assigned to ${engineer.name}`, req.ip || '127.0.0.1');

  // Notify employee and assigned engineer
  db.prepare(`
    INSERT INTO notifications (user_id, ticket_id, type, title, message)
    VALUES (?, ?, 'TICKET_ASSIGNED', 'Ticket Assigned', ?)
  `).run(ticket.created_by, ticket.id, `Your ticket #${ticket.ticket_number} has been assigned to ${engineer.name}.`);

  if (engineer.id !== user.id) {
    db.prepare(`
      INSERT INTO notifications (user_id, ticket_id, type, title, message)
      VALUES (?, ?, 'TICKET_ASSIGNED', 'New Assignment', ?)
    `).run(engineer.id, ticket.id, `You were assigned ticket #${ticket.ticket_number} by ${user.name}.`);
  }

  res.json({
    message: `Ticket successfully assigned to ${engineer.name}`,
    assigned_to: engineer.id,
    assignee_name: engineer.name,
    status: newStatus
  });
});

// POST /api/tickets/:id/resolve
router.post('/:id/resolve', authenticateToken, requireRole(['IT_ENGINEER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const ticketId = req.params.id;
  const { resolution_notes } = req.body;

  if (!resolution_notes || !resolution_notes.trim()) {
    res.status(400).json({ error: 'Resolution notes are required to resolve a ticket.' });
    return;
  }

  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ? OR ticket_number = ?").get(ticketId, ticketId) as any;
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  // Calculate resolution time in seconds
  const createdAtMs = new Date(ticket.created_at).getTime();
  const nowMs = Date.now();
  const resolutionTimeSec = Math.max(1, Math.round((nowMs - createdAtMs) / 1000));

  db.prepare(`
    UPDATE tickets 
    SET status = 'RESOLVED',
        resolution_notes = ?,
        resolved_by = ?,
        resolved_at = CURRENT_TIMESTAMP,
        resolution_time_seconds = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(resolution_notes.trim(), user.id, resolutionTimeSec, ticket.id);

  db.prepare(`
    INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by)
    VALUES (?, ?, 'RESOLVED', ?)
  `).run(ticket.id, ticket.status, user.id);

  db.prepare(`
    INSERT INTO audit_logs (ticket_id, user_id, action, old_value, new_value, description, ip_address)
    VALUES (?, ?, 'TICKET_RESOLVED', ?, 'RESOLVED', ?, ?)
  `).run(
    ticket.id, 
    user.id, 
    ticket.status, 
    `Ticket resolved by ${user.name} (${formatDuration(resolutionTimeSec)}). Resolution: ${resolution_notes.trim()}`, 
    req.ip || '127.0.0.1'
  );

  // Notify employee
  db.prepare(`
    INSERT INTO notifications (user_id, ticket_id, type, title, message)
    VALUES (?, ?, 'TICKET_RESOLVED', 'Ticket Resolved', ?)
  `).run(ticket.created_by, ticket.id, `Ticket #${ticket.ticket_number} has been resolved by ${user.name}. Resolution: "${resolution_notes.trim()}".`);

  res.json({
    message: 'Ticket resolved successfully',
    resolution_time_seconds: resolutionTimeSec,
    resolution_time_formatted: formatDuration(resolutionTimeSec),
    resolution_notes: resolution_notes.trim()
  });
});

// POST /api/tickets/:id/reopen
router.post('/:id/reopen', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const ticketId = req.params.id;
  const { reason } = req.body;

  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ? OR ticket_number = ?").get(ticketId, ticketId) as any;
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  if (user.role === 'EMPLOYEE' && ticket.created_by !== user.id) {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }

  const oldStatus = ticket.status;
  const newStatus = 'IN PROGRESS';

  db.prepare(`
    UPDATE tickets 
    SET status = ?, resolved_at = NULL, resolution_time_seconds = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, ticket.id);

  db.prepare(`
    INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by)
    VALUES (?, ?, ?, ?)
  `).run(ticket.id, oldStatus, newStatus, user.id);

  const desc = reason 
    ? `Ticket reopened by ${user.name}. Reason: ${reason}` 
    : `Ticket reopened by ${user.name}`;

  db.prepare(`
    INSERT INTO audit_logs (ticket_id, user_id, action, old_value, new_value, description, ip_address)
    VALUES (?, ?, 'TICKET_REOPENED', ?, ?, ?, ?)
  `).run(ticket.id, user.id, oldStatus, newStatus, desc, req.ip || '127.0.0.1');

  if (ticket.assigned_to) {
    db.prepare(`
      INSERT INTO notifications (user_id, ticket_id, type, title, message)
      VALUES (?, ?, 'TICKET_REOPENED', 'Ticket Reopened', ?)
    `).run(ticket.assigned_to, ticket.id, `${user.name} reopened ticket #${ticket.ticket_number}`);
  }

  res.json({
    message: 'Ticket reopened successfully',
    status: newStatus
  });
});

// PATCH /api/tickets/:id (General status / priority change)
router.patch('/:id', authenticateToken, requireRole(['IT_ENGINEER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const ticketId = req.params.id;
  const { status, priority } = req.body;

  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ? OR ticket_number = ?").get(ticketId, ticketId) as any;
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  if (status && status !== ticket.status) {
    db.prepare("UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, ticket.id);
    db.prepare("INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)").run(ticket.id, ticket.status, status, user.id);
    db.prepare("INSERT INTO audit_logs (ticket_id, user_id, action, old_value, new_value, description, ip_address) VALUES (?, ?, 'STATUS_CHANGED', ?, ?, ?, ?)").run(ticket.id, user.id, ticket.status, status, `Status changed from ${ticket.status} to ${status}`, req.ip || '127.0.0.1');
  }

  if (priority && priority !== ticket.priority) {
    db.prepare("UPDATE tickets SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(priority, ticket.id);
    db.prepare("INSERT INTO audit_logs (ticket_id, user_id, action, old_value, new_value, description, ip_address) VALUES (?, ?, 'PRIORITY_CHANGED', ?, ?, ?, ?)").run(ticket.id, user.id, ticket.priority, priority, `Priority changed from ${ticket.priority} to ${priority}`, req.ip || '127.0.0.1');
  }

  res.json({ message: 'Ticket updated successfully' });
});

export default router;
