import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Helper to seed leave balances for newly onboarded user
function seedUserLeaveBalances(userId: number | bigint) {
  const currentYear = new Date().getFullYear();
  try {
    const leaveTypes = db.prepare("SELECT id, days_per_year FROM leave_types WHERE is_active = 1").all() as any[];
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO leave_balances (employee_id, leave_type_id, year, allocated_days, used_days, remaining_days)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
    for (const lt of leaveTypes) {
      stmt.run(userId, lt.id, currentYear, lt.days_per_year, lt.days_per_year);
    }
  } catch (err) {
    console.error('[LEAVE BALANCE SEED ERROR]', err);
  }
}

// GET /api/users (Accessible by IT Engineers, HR, and Admin)
router.get('/', authenticateToken, requireRole(['IT_ENGINEER', 'ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const { role, department_id, search } = req.query;

  let query = `
    SELECT u.id, u.name, u.email, u.role, u.department_id, u.employee_id, u.phone, u.designation, u.is_active, u.created_at,
           d.name as department_name,
           dev.id as device_id, dev.asset_tag, dev.device_name
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

// POST /api/users (Admin or HR: Onboard employee / engineer)
router.post('/', authenticateToken, requireRole(['ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const { name, email, password = 'Password@123', role = 'EMPLOYEE', department_id, employee_id, phone, designation } = req.body;

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
  const empCode = employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

  const info = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department_id, employee_id, phone, designation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    email.toLowerCase().trim(),
    passwordHash,
    role,
    department_id || null,
    empCode,
    phone || null,
    designation || null
  );

  const newUserId = info.lastInsertRowid;
  seedUserLeaveBalances(newUserId);

  // Department name lookup
  let deptName = '';
  if (department_id) {
    const dept = db.prepare("SELECT name FROM departments WHERE id = ?").get(department_id) as any;
    if (dept) deptName = dept.name;
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, new_value, description, ip_address)
    VALUES (?, 'USER_CREATED', ?, ?, ?)
  `).run(actor.id, email, `User account onboarded: ${name} (${role}) by ${actor.name}`, req.ip || '127.0.0.1');

  // Trigger Automatic Notification to all IT Engineers to Allot a Workstation
  const itEngineers = db.prepare("SELECT id FROM users WHERE role IN ('IT_ENGINEER', 'ADMIN')").all() as any[];
  const notifStmt = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'SYSTEM_ALERT', ?, ?)
  `);
  for (const it of itEngineers) {
    notifStmt.run(
      it.id,
      'New Employee Onboarding - Allot System',
      `HR (${actor.name}) onboarded new team member ${name} (${empCode}, Dept: ${deptName || 'General'}). Please allocate and configure an IT workstation.`
    );
  }

  const createdUser = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.department_id, u.employee_id, u.phone, u.designation, u.is_active, u.created_at,
           d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(newUserId);

  res.status(201).json({
    message: 'Employee onboarded successfully. IT team has been notified for system allocation.',
    user: createdUser
  });
});

// POST /api/users/bulk (Admin or HR: Bulk onboard employees from CSV/Excel)
router.post('/bulk', authenticateToken, requireRole(['ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const { employees } = req.body;

  if (!Array.isArray(employees) || employees.length === 0) {
    res.status(400).json({ error: 'Valid employees array is required.' });
    return;
  }

  const departments = db.prepare("SELECT id, name FROM departments").all() as any[];
  const deptMap: Record<string, number> = {};
  for (const d of departments) {
    deptMap[d.name.toLowerCase().trim()] = d.id;
  }

  let importedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  const checkStmt = db.prepare("SELECT id FROM users WHERE email = ?");
  const insertStmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department_id, employee_id, phone, designation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const passwordHash = bcrypt.hashSync('Password@123', 10);

  for (const emp of employees) {
    const name = emp.name ? String(emp.name).trim() : '';
    const email = emp.email ? String(emp.email).toLowerCase().trim() : '';

    if (!name || !email) {
      skippedCount++;
      continue;
    }

    if (checkStmt.get(email)) {
      skippedCount++;
      continue;
    }

    let deptId = emp.department_id ? Number(emp.department_id) : null;
    if (!deptId && emp.department) {
      const dKey = String(emp.department).toLowerCase().trim();
      deptId = deptMap[dKey] || null;
    }

    const empCode = emp.employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const role = ['EMPLOYEE', 'IT_ENGINEER', 'HR', 'ADMIN'].includes(emp.role) ? emp.role : 'EMPLOYEE';

    try {
      const res = insertStmt.run(
        name,
        email,
        passwordHash,
        role,
        deptId,
        empCode,
        emp.phone || null,
        emp.designation || null
      );
      seedUserLeaveBalances(res.lastInsertRowid);
      importedCount++;
    } catch (err: any) {
      errors.push(`${email}: ${err.message}`);
      skippedCount++;
    }
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, new_value, description, ip_address)
    VALUES (?, 'USER_CREATED', ?, ?, ?)
  `).run(actor.id, `${importedCount} users`, `Bulk onboarding: ${importedCount} employees imported by ${actor.name}`, req.ip || '127.0.0.1');

  // Trigger Notification to IT Engineers for Bulk System Allocation
  if (importedCount > 0) {
    const itEngineers = db.prepare("SELECT id FROM users WHERE role IN ('IT_ENGINEER', 'ADMIN')").all() as any[];
    const notifStmt = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, 'SYSTEM_ALERT', ?, ?)
    `);
    for (const it of itEngineers) {
      notifStmt.run(
        it.id,
        'Bulk Onboarding - Workstations Needed',
        `HR (${actor.name}) onboarded ${importedCount} new team members in bulk. Please review the employee directory and allocate systems.`
      );
    }
  }

  res.json({
    message: `Successfully imported ${importedCount} employees (${skippedCount} skipped/duplicates).`,
    importedCount,
    skippedCount,
    errors
  });
});

// DELETE /api/users/:id (Admin or HR: Delete/Deactivate employee)
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const userId = Number(req.params.id);

  if (userId === actor.id) {
    res.status(400).json({ error: 'You cannot delete your own account.' });
    return;
  }

  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!target) {
    res.status(404).json({ error: 'Employee not found.' });
    return;
  }

  if (target.email === 'admin@flymedia.com') {
    res.status(403).json({ error: 'Cannot delete primary system administrator.' });
    return;
  }

  // Unassign any assigned devices
  db.prepare("UPDATE devices SET employee_id = NULL WHERE employee_id = ?").run(userId);

  // Delete user records & cascade
  db.prepare("DELETE FROM users WHERE id = ?").run(userId);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, old_value, description, ip_address)
    VALUES (?, 'USER_DELETED', ?, ?, ?)
  `).run(actor.id, target.email, `Employee deleted: ${target.name} (${target.employee_id}) by ${actor.name}`, req.ip || '127.0.0.1');

  res.json({ message: `Employee ${target.name} removed successfully.` });
});

export default router;
