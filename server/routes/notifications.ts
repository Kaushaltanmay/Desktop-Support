import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  const notifications = db.prepare(`
    SELECT n.*, t.ticket_number
    FROM notifications n
    LEFT JOIN tickets t ON n.ticket_id = t.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 20
  `).all(user.id);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
  `).get(user.id) as any;

  res.json({
    notifications,
    unreadCount: unreadCount ? unreadCount.count : 0
  });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifId = req.params.id;

  db.prepare(`
    UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
  `).run(notifId, user.id);

  res.json({ message: 'Marked as read' });
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  db.prepare(`
    UPDATE notifications SET is_read = 1 WHERE user_id = ?
  `).run(user.id);

  res.json({ message: 'All notifications marked as read' });
});

export default router;
