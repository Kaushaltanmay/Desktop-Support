import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/holidays
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const holidays = db.prepare("SELECT * FROM holidays ORDER BY date ASC").all();
  res.json({ holidays });
});

// POST /api/holidays (HR/Admin)
router.post('/', authenticateToken, requireRole(['HR', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { name, date, description } = req.body;

  if (!name || !date) {
    res.status(400).json({ error: 'Holiday name and date are required.' });
    return;
  }

  try {
    const resInsert = db.prepare(`
      INSERT INTO holidays (name, date, description)
      VALUES (?, ?, ?)
    `).run(name, date, description || null);

    res.status(201).json({
      message: 'Holiday added to calendar.',
      id: resInsert.lastInsertRowid
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Holiday already exists for this date.' });
  }
});

export default router;
