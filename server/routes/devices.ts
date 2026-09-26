import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/devices
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { search, status, department_id } = req.query;

  let query = `
    SELECT dev.*, 
           u.name as employee_name, u.email as employee_email, u.employee_id as employee_code,
           d.name as department_name
    FROM devices dev
    LEFT JOIN users u ON dev.employee_id = u.id
    LEFT JOIN departments d ON dev.department_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ` AND dev.status = ?`;
    params.push(status);
  }

  if (department_id && department_id !== 'all') {
    query += ` AND dev.department_id = ?`;
    params.push(department_id);
  }

  if (search) {
    query += ` AND (
      dev.asset_tag LIKE ? OR 
      dev.device_name LIKE ? OR 
      u.name LIKE ? OR 
      dev.model LIKE ? OR 
      dev.serial_number LIKE ?
    )`;
    const p = `%${search}%`;
    params.push(p, p, p, p, p);
  }

  query += ` ORDER BY dev.id ASC`;

  const devices = db.prepare(query).all(...params);
  res.json({ devices });
});

// POST /api/devices (IT Engineer / Admin can add device)
router.post('/', authenticateToken, requireRole(['IT_ENGINEER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const {
    asset_tag,
    device_name,
    employee_id,
    department_id,
    device_type = 'Desktop PC',
    manufacturer,
    model,
    serial_number,
    operating_system = 'Windows 11 Pro',
    ip_address,
    cpu,
    ram,
    storage,
    status = 'Active'
  } = req.body;

  if (!asset_tag || !device_name) {
    res.status(400).json({ error: 'Asset tag and device name are required.' });
    return;
  }

  // Check unique asset tag
  const existing = db.prepare("SELECT id FROM devices WHERE asset_tag = ?").get(asset_tag.trim());
  if (existing) {
    res.status(400).json({ error: `Asset tag ${asset_tag} already exists.` });
    return;
  }

  const info = db.prepare(`
    INSERT INTO devices (
      asset_tag, device_name, employee_id, department_id, device_type,
      manufacturer, model, serial_number, operating_system, ip_address,
      cpu, ram, storage, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    asset_tag.trim().toUpperCase(),
    device_name.trim(),
    employee_id || null,
    department_id || null,
    device_type,
    manufacturer || 'Generic',
    model || 'Workstation',
    serial_number || `SN-${Date.now()}`,
    operating_system,
    ip_address || '10.24.110.0',
    cpu || 'Intel Core i5',
    ram || '16 GB DDR4',
    storage || '512 GB SSD',
    status
  );

  // Log audit
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, new_value, description, ip_address)
    VALUES (?, 'SYSTEM_ADDED', ?, ?, ?)
  `).run(user.id, asset_tag, `Device ${asset_tag} (${device_name}) created by ${user.name}`, req.ip || '127.0.0.1');

  const created = db.prepare(`
    SELECT dev.*, u.name as employee_name, d.name as department_name
    FROM devices dev
    LEFT JOIN users u ON dev.employee_id = u.id
    LEFT JOIN departments d ON dev.department_id = d.id
    WHERE dev.id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json({
    message: 'Device created successfully',
    device: created
  });
});

// PATCH /api/devices/:id
router.patch('/:id', authenticateToken, requireRole(['IT_ENGINEER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const deviceId = req.params.id;
  const { employee_id, status, cpu, ram, storage, operating_system, ip_address } = req.body;

  const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(deviceId) as any;
  if (!device) {
    res.status(404).json({ error: 'Device not found.' });
    return;
  }

  db.prepare(`
    UPDATE devices 
    SET employee_id = COALESCE(?, employee_id),
        status = COALESCE(?, status),
        cpu = COALESCE(?, cpu),
        ram = COALESCE(?, ram),
        storage = COALESCE(?, storage),
        operating_system = COALESCE(?, operating_system),
        ip_address = COALESCE(?, ip_address),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    employee_id !== undefined ? employee_id : device.employee_id,
    status || device.status,
    cpu || device.cpu,
    ram || device.ram,
    storage || device.storage,
    operating_system || device.operating_system,
    ip_address || device.ip_address,
    device.id
  );

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, description, ip_address)
    VALUES (?, 'SYSTEM_UPDATED', ?, ?)
  `).run(user.id, `Device ${device.asset_tag} updated by ${user.name}`, req.ip || '127.0.0.1');

  res.json({ message: 'Device updated successfully' });
});

export default router;
