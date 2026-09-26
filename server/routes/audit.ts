import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/audit-logs
router.get('/', authenticateToken, requireRole(['IT_ENGINEER', 'ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const { action, entity_type, search, limit = 100 } = req.query;

  let query = `
    SELECT a.*, 
           u.name as user_name, u.email as user_email, u.role as user_role,
           t.ticket_number, t.subject as ticket_subject
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN tickets t ON a.ticket_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (entity_type && entity_type !== 'all') {
    query += ` AND a.entity_type = ?`;
    params.push(entity_type);
  }

  if (action && action !== 'all') {
    query += ` AND a.action = ?`;
    params.push(action);
  }

  if (search) {
    query += ` AND (
      a.description LIKE ? OR 
      a.action LIKE ? OR 
      u.name LIKE ? OR 
      t.ticket_number LIKE ?
    )`;
    const p = `%${search}%`;
    params.push(p, p, p, p);
  }

  query += ` ORDER BY a.created_at DESC, a.id DESC LIMIT ?`;
  params.push(Number(limit));

  const auditLogs = db.prepare(query).all(...params);
  res.json({ auditLogs });
});

export default router;
