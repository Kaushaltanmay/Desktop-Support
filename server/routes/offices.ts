import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/offices
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const offices = db.prepare("SELECT * FROM offices WHERE is_active = 1 ORDER BY id ASC").all();
  res.json({ offices });
});

// POST /api/offices (Admin)
router.post('/', authenticateToken, requireRole(['ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const { office_name, address, latitude, longitude, allowed_radius_meters } = req.body;

  if (!office_name || !latitude || !longitude) {
    res.status(400).json({ error: 'Office name, latitude, and longitude are required.' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO offices (office_name, address, latitude, longitude, allowed_radius_meters)
    VALUES (?, ?, ?, ?, ?)
  `).run(office_name, address || '', latitude, longitude, allowed_radius_meters || 500);

  res.status(201).json({
    message: 'Office location added successfully.',
    id: result.lastInsertRowid
  });
});

// PATCH /api/offices/:id (Admin/HR configure radius or coords)
router.patch('/:id', authenticateToken, requireRole(['ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const { office_name, address, latitude, longitude, allowed_radius_meters, is_active } = req.body;
  const officeId = req.params.id;

  const existing = db.prepare("SELECT * FROM offices WHERE id = ?").get(officeId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Office not found.' });
    return;
  }

  db.prepare(`
    UPDATE offices
    SET office_name = ?, address = ?, latitude = ?, longitude = ?,
        allowed_radius_meters = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    office_name !== undefined ? office_name : existing.office_name,
    address !== undefined ? address : existing.address,
    latitude !== undefined ? latitude : existing.latitude,
    longitude !== undefined ? longitude : existing.longitude,
    allowed_radius_meters !== undefined ? allowed_radius_meters : existing.allowed_radius_meters,
    is_active !== undefined ? is_active : existing.is_active,
    officeId
  );

  res.json({ message: 'Office location updated successfully.' });
});

export default router;
