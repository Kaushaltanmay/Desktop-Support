import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/users
router.get('/', authenticateToken, requireRole(['IT_ENGINEER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { role, department_id, search } = req.query;

  let query = `
    SELECT u.id, u.name, u.email, u.role, u.department_id, u.employee_id, u.phone, u.is_active, u.created_at,
           d.name as department_name,
           dev.asset_tag, dev.device_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN devices dev ON dev.employee_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (role && role !== 'all') {
    query += ` AND u.role = ?`;
    params.push(role);
  }

  if (department_id && department_id !== 'all') {
    query += ` AND u.department_id = ?`;
    params.push(department_id);
  }

  if (search) {
    query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.employee_id LIKE ?)`;
    const p = `%${search}%`;
    params.push(p, p, p);
  }

  query += ` ORDER BY u.id ASC`;

  const users = db.prepare(query).all(...params);
  const departments = db.prepare("SELECT * FROM departments ORDER BY name ASC").all();

  res.json({ users, departments });
});

// POST /api/users (Admin only: create employee / engineer)
router.post('/', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const adminUser = req.user!;
  const { name, email, password = 'Password@123', role = 'EMPLOYEE', department_id, employee_id, phone } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required.' });
    return;
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (existing) {
    res.status(400).json({ error: `User with email ${email} already exists.` });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const empCode = employee_id || `EMP-${Math.floor(100 + Math.random() * 900)}`;

  const info = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department_id, employee_id, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    email.toLowerCase().trim(),
    passwordHash,
    role,
    department_id || null,
    empCode,
    phone || null
  );

  const newUserId = info.lastInsertRowid;

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, new_value, description, ip_address)
    VALUES (?, 'USER_CREATED', ?, ?, ?)
  `).run(adminUser.id, email, `User account created: ${name} (${role})`, req.ip || '127.0.0.1');

  const createdUser = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.department_id, u.employee_id, u.phone, u.is_active, u.created_at,
           d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(newUserId);

  res.status(201).json({
    message: 'User created successfully',
    user: createdUser
  });
});

export default router;
