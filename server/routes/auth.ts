import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'desktop_it_support_jwt_secret_token_2026_flymedia';

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db.prepare(`
    SELECT u.*, d.name as department_name 
    FROM users u 
    LEFT JOIN departments d ON u.department_id = d.id 
    WHERE u.email = ? AND u.is_active = 1
  `).get(email.toLowerCase().trim()) as any;

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const isValidPassword = bcrypt.compareSync(password, user.password_hash);
  if (!isValidPassword) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department_id: user.department_id,
      employee_id: user.employee_id
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Return user without password_hash
  const { password_hash, ...safeUser } = user;

  res.json({
    token,
    user: safeUser
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const user = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.department_id, u.employee_id, u.phone, u.created_at,
           d.name as department_name,
           dev.id as device_id, dev.asset_tag, dev.device_name, dev.model, dev.cpu, dev.ram, dev.storage, dev.operating_system
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN devices dev ON dev.employee_id = u.id
    WHERE u.id = ?
  `).get(req.user.id) as any;

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({ user });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully.' });
});

export default router;
