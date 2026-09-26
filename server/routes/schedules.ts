import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/work-schedules
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const schedules = db.prepare("SELECT * FROM work_schedules ORDER BY id ASC").all();
  res.json({ schedules });
});

// PATCH /api/work-schedules/:id
router.patch('/:id', authenticateToken, requireRole(['HR', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { schedule_name, start_time, end_time, grace_period_minutes, expected_hours, standard_daily_minutes } = req.body;
  const scheduleId = req.params.id;

  const existing = db.prepare("SELECT * FROM work_schedules WHERE id = ?").get(scheduleId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Work schedule not found.' });
    return;
  }

  db.prepare(`
    UPDATE work_schedules
    SET schedule_name = ?, start_time = ?, end_time = ?, grace_period_minutes = ?,
        expected_hours = ?, standard_daily_minutes = ?
    WHERE id = ?
  `).run(
    schedule_name || existing.schedule_name,
    start_time || existing.start_time,
    end_time || existing.end_time,
    grace_period_minutes !== undefined ? grace_period_minutes : existing.grace_period_minutes,
    expected_hours !== undefined ? expected_hours : existing.expected_hours,
    standard_daily_minutes !== undefined ? standard_daily_minutes : existing.standard_daily_minutes,
    scheduleId
  );

  res.json({ message: 'Work schedule updated successfully.' });
});

export default router;
