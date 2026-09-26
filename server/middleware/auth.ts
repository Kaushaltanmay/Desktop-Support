import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'desktop_it_support_jwt_secret_token_2026_flymedia';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'EMPLOYEE' | 'IT_ENGINEER' | 'ADMIN' | 'HR';
  department_id?: number;
  employee_id?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Access denied. Authentication token required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired session token.' });
    return;
  }
}

export function requireRole(allowedRoles: Array<'EMPLOYEE' | 'IT_ENGINEER' | 'ADMIN' | 'HR'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden. You do not have permission for this resource.' });
      return;
    }

    next();
  };
}
