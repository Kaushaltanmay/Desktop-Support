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

// Helper: Ensure department exists, or automatically create it
export function ensureDepartment(name?: string): number | null {
  if (!name || !name.trim()) return null;
  const clean = name.trim();
  const existing = db.prepare("SELECT id FROM departments WHERE LOWER(name) = LOWER(?)").get(clean) as any;
  if (existing) return existing.id;

  try {
    const res = db.prepare("INSERT INTO departments (name) VALUES (?)").run(clean);
    console.log(`[DEPT AUTO-CREATED] Created new department: "${clean}" (ID: ${res.lastInsertRowid})`);

    // Sync with MongoDB departments
    try {
      const { getMongoDb } = require('../mongo');
      getMongoDb().collection('departments').updateOne(
        { name: clean },
        { $set: { sqlite_id: Number(res.lastInsertRowid), name: clean, created_at: new Date() } },
        { upsert: true }
      ).catch(() => {});
    } catch {}

    return Number(res.lastInsertRowid);
  } catch (err: any) {
    console.error('[DEPT CREATION ERROR]', err.message);
    const fallback = db.prepare("SELECT id FROM departments WHERE LOWER(name) = LOWER(?)").get(clean) as any;
    return fallback ? fallback.id : null;
  }
}

// Helper: Ensure company role exists or register new employee role
export function ensureRole(roleOrTitle?: string): string {
  if (!roleOrTitle || !roleOrTitle.trim()) return 'EMPLOYEE';
  const clean = roleOrTitle.trim();

  // Check if role exists in company_roles
  const existing = db.prepare("SELECT name, portal_access FROM company_roles WHERE LOWER(name) = LOWER(?)").get(clean) as any;
  if (!existing) {
    let portalAccess = 'EMPLOYEE';
    const lower = clean.toLowerCase();
    if (lower.includes('admin')) portalAccess = 'ADMIN';
    else if (lower.includes('hr') || lower.includes('human resource') || lower.includes('people ops') || lower.includes('talent')) portalAccess = 'HR';
    else if (lower.includes('it') || lower.includes('engineer') || lower.includes('sysadmin') || lower.includes('devops') || lower.includes('network') || lower.includes('support')) portalAccess = 'IT_ENGINEER';

    try {
      db.prepare("INSERT OR IGNORE INTO company_roles (name, portal_access) VALUES (?, ?)").run(clean, portalAccess);
      console.log(`[ROLE AUTO-CREATED] Registered new company role: "${clean}" (Portal: ${portalAccess})`);

      // Sync with MongoDB
      try {
        const { getMongoDb } = require('../mongo');
        getMongoDb().collection('company_roles').updateOne(
          { name: clean },
          { $set: { name: clean, portal_access: portalAccess, created_at: new Date() } },
          { upsert: true }
        ).catch(() => {});
      } catch {}
    } catch {}
  }

  // Determine system portal role
  const upper = clean.toUpperCase();
  if (['EMPLOYEE', 'IT_ENGINEER', 'ADMIN', 'HR'].includes(upper)) {
    return upper;
  }
  const lower = clean.toLowerCase();
  if (lower.includes('admin')) return 'ADMIN';
  if (lower.includes('hr') || lower.includes('human resource') || lower.includes('people ops')) return 'HR';
  if (lower.includes('it') || lower.includes('engineer') || lower.includes('sysadmin') || lower.includes('devops')) return 'IT_ENGINEER';
  return 'EMPLOYEE';
}

// Helper: Generate or validate unique username
function generateUniqueUsername(preferredUsername?: string, email?: string, name?: string, excludeUserId?: number): string {
  let base = '';
  if (preferredUsername && preferredUsername.trim()) {
    base = preferredUsername.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
  } else if (email && email.includes('@')) {
    base = email.split('@')[0].toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
  } else if (name && name.trim()) {
    base = name.toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9._-]/g, '');
  }
  if (!base) base = 'emp';

  let candidate = base;
  let counter = 1;
  const checkSql = excludeUserId 
    ? "SELECT id FROM users WHERE LOWER(username) = ? AND id != ?" 
    : "SELECT id FROM users WHERE LOWER(username) = ?";

  while (true) {
    const existing = excludeUserId 
      ? db.prepare(checkSql).get(candidate, excludeUserId)
      : db.prepare(checkSql).get(candidate);
    
    if (!existing) break;
    candidate = `${base}${counter}`;
    counter++;
  }
  return candidate;
}

// Helper: Sync user with MongoDB
function syncUserToMongo(user: any) {
  try {
    const { getMongoDb } = require('../mongo');
    getMongoDb().collection('users').updateOne(
      { sqlite_id: user.id },
      {
        $set: {
          sqlite_id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          designation: user.designation,
          department_id: user.department_id,
          employee_id: user.employee_id,
          phone: user.phone,
          is_active: user.is_active,
          updated_at: new Date()
        }
      },
      { upsert: true }
    ).catch(() => {});
  } catch {}
}

// GET /api/users/roles (List all company roles)
router.get('/roles', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const roles = db.prepare("SELECT * FROM company_roles ORDER BY name ASC").all();
  res.json({ roles });
});

// GET /api/users (Accessible by IT Engineers, HR, and Admin)
router.get('/', authenticateToken, requireRole(['IT_ENGINEER', 'ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const { role, department_id, search } = req.query;

  let query = `
    SELECT u.id, u.name, u.username, u.email, u.role, u.department_id, u.employee_id, u.phone, u.designation, u.is_active, u.created_at,
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
    query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.username LIKE ? OR u.employee_id LIKE ?)`;
    const p = `%${search}%`;
    params.push(p, p, p, p);
  }

  query += ` ORDER BY u.id ASC`;

  const users = db.prepare(query).all(...params);
  const departments = db.prepare("SELECT * FROM departments ORDER BY name ASC").all();
  const roles = db.prepare("SELECT * FROM company_roles ORDER BY name ASC").all();

  res.json({ users, departments, roles });
});

// POST /api/users (Admin or HR: Onboard single employee / candidate)
router.post('/', authenticateToken, requireRole(['ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const { 
    name, 
    email, 
    username: customUsername, 
    password = 'Password@123', 
    role: inputRole = 'EMPLOYEE', 
    department_id, 
    department_name, 
    employee_id, 
    phone, 
    designation 
  } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required.' });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);
  if (existing) {
    res.status(400).json({ error: `User with email ${cleanEmail} already exists.` });
    return;
  }

  // Auto-detect & create department if name provided
  let deptId = department_id ? Number(department_id) : null;
  if (!deptId && department_name) {
    deptId = ensureDepartment(department_name);
  }

  // Auto-detect & create role if new
  const systemRole = ensureRole(inputRole || designation);
  if (designation) {
    ensureRole(designation);
  }

  // Unique username & password hashing
  const username = generateUniqueUsername(customUsername, cleanEmail, name);
  const passwordHash = bcrypt.hashSync(password || 'Password@123', 10);
  const empCode = employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

  const info = db.prepare(`
    INSERT INTO users (name, username, email, password_hash, role, department_id, employee_id, phone, designation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    username,
    cleanEmail,
    passwordHash,
    systemRole,
    deptId,
    empCode,
    phone || null,
    designation || inputRole || null
  );

  const newUserId = info.lastInsertRowid;
  seedUserLeaveBalances(newUserId);

  let deptName = '';
  if (deptId) {
    const dept = db.prepare("SELECT name FROM departments WHERE id = ?").get(deptId) as any;
    if (dept) deptName = dept.name;
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, new_value, description, ip_address)
    VALUES (?, 'USER_CREATED', ?, ?, ?)
  `).run(actor.id, cleanEmail, `Candidate onboarded: ${name} (User: ${username}, Role: ${systemRole}) by ${actor.name}`, req.ip || '127.0.0.1');

  // Trigger Automatic Notification to IT Engineers to Allot a Workstation
  const itEngineers = db.prepare("SELECT id FROM users WHERE role IN ('IT_ENGINEER', 'ADMIN')").all() as any[];
  const notifStmt = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'SYSTEM_ALERT', ?, ?)
  `);
  for (const it of itEngineers) {
    notifStmt.run(
      it.id,
      'New Employee Onboarding - Allot System',
      `HR (${actor.name}) onboarded new team member ${name} (${empCode}, User: ${username}, Dept: ${deptName || 'General'}). Please allocate an IT workstation.`
    );
  }

  const createdUser = db.prepare(`
    SELECT u.id, u.name, u.username, u.email, u.role, u.department_id, u.employee_id, u.phone, u.designation, u.is_active, u.created_at,
           d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(newUserId);

  syncUserToMongo(createdUser);

  res.status(201).json({
    message: 'Candidate onboarded successfully. IT team notified for workstation setup.',
    user: createdUser,
    credentials: {
      username,
      email: cleanEmail,
      temporaryPassword: password
    }
  });
});

// POST /api/users/bulk (Admin or HR: Bulk onboard employees from Excel with Auto-Dept & Auto-Role)
router.post('/bulk', authenticateToken, requireRole(['ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const { employees } = req.body;

  if (!Array.isArray(employees) || employees.length === 0) {
    res.status(400).json({ error: 'Valid employees array is required.' });
    return;
  }

  let importedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];
  const credentialsList: any[] = [];

  const checkEmailStmt = db.prepare("SELECT id FROM users WHERE email = ?");
  const insertStmt = db.prepare(`
    INSERT INTO users (name, username, email, password_hash, role, department_id, employee_id, phone, designation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const emp of employees) {
    const name = emp.name ? String(emp.name).trim() : '';
    const email = emp.email ? String(emp.email).toLowerCase().trim() : '';

    if (!name || !email) {
      skippedCount++;
      continue;
    }

    if (checkEmailStmt.get(email)) {
      skippedCount++;
      continue;
    }

    // 1. Auto-create department if new
    let deptId = emp.department_id ? Number(emp.department_id) : null;
    const deptNameInput = emp.department || emp.department_name;
    if (!deptId && deptNameInput) {
      deptId = ensureDepartment(deptNameInput);
    }

    // 2. Auto-create role if new
    const rawRole = emp.role || emp.designation || 'EMPLOYEE';
    const systemRole = ensureRole(rawRole);
    if (emp.designation) {
      ensureRole(emp.designation);
    }

    // 3. Username & Password from sheet
    const rawUsername = emp.username || emp.loginid || emp.user;
    const username = generateUniqueUsername(rawUsername, email, name);

    const plainPassword = emp.password || emp.pass || 'Welcome@123';
    const passwordHash = bcrypt.hashSync(String(plainPassword), 10);

    const empCode = emp.employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = insertStmt.run(
        name,
        username,
        email,
        passwordHash,
        systemRole,
        deptId,
        empCode,
        emp.phone || null,
        emp.designation || rawRole || null
      );
      const newUserId = res.lastInsertRowid;
      seedUserLeaveBalances(newUserId);

      syncUserToMongo({
        id: Number(newUserId),
        name,
        username,
        email,
        role: systemRole,
        designation: emp.designation || rawRole,
        department_id: deptId,
        employee_id: empCode,
        phone: emp.phone,
        is_active: 1
      });

      credentialsList.push({
        name,
        username,
        email,
        employee_id: empCode,
        initialPassword: plainPassword
      });

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
  `).run(actor.id, `${importedCount} users`, `Bulk Excel import: ${importedCount} employees created with auto-departments & roles by ${actor.name}`, req.ip || '127.0.0.1');

  // Trigger Notification to IT Engineers
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
        `HR (${actor.name}) imported ${importedCount} employees from Excel. New departments and roles registered. Please configure workstations.`
      );
    }
  }

  res.json({
    message: `Successfully imported ${importedCount} employees (${skippedCount} skipped/duplicates).`,
    importedCount,
    skippedCount,
    credentials: credentialsList,
    errors
  });
});

// PUT /api/users/:id (Admin or HR: Edit Candidate / Employee Details)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const userId = Number(req.params.id);
  const { 
    name, 
    username: customUsername, 
    email, 
    phone, 
    role: inputRole, 
    designation, 
    department_id, 
    department_name, 
    employee_id, 
    is_active 
  } = req.body;

  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!target) {
    res.status(404).json({ error: 'Employee not found.' });
    return;
  }

  if (target.email === 'admin@flymedia.com' && actor.email !== 'admin@flymedia.com') {
    res.status(403).json({ error: 'Only the Primary Administrator can edit the system admin account.' });
    return;
  }

  // Validate email uniqueness if changing
  const cleanEmail = email ? email.toLowerCase().trim() : target.email;
  if (cleanEmail !== target.email) {
    const emailConflict = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(cleanEmail, userId);
    if (emailConflict) {
      res.status(400).json({ error: `Email ${cleanEmail} is already used by another account.` });
      return;
    }
  }

  // Auto-detect or resolve department
  let deptId = department_id !== undefined ? (department_id ? Number(department_id) : null) : target.department_id;
  if (department_name && department_name.trim()) {
    deptId = ensureDepartment(department_name.trim());
  }

  // Auto-detect or resolve role
  let systemRole = target.role;
  if (inputRole) {
    systemRole = ensureRole(inputRole);
  }
  if (designation) {
    ensureRole(designation);
  }

  // Unique username
  const username = generateUniqueUsername(customUsername || target.username, cleanEmail, name || target.name, userId);

  db.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name),
        username = ?,
        email = ?,
        phone = ?,
        role = ?,
        designation = ?,
        department_id = ?,
        employee_id = COALESCE(?, employee_id),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name ? name.trim() : target.name,
    username,
    cleanEmail,
    phone !== undefined ? phone : target.phone,
    systemRole,
    designation !== undefined ? designation : target.designation,
    deptId,
    employee_id ? employee_id.trim() : target.employee_id,
    is_active !== undefined ? Number(is_active) : target.is_active,
    userId
  );

  const updatedUser = db.prepare(`
    SELECT u.id, u.name, u.username, u.email, u.role, u.department_id, u.employee_id, u.phone, u.designation, u.is_active, u.created_at, u.updated_at,
           d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(userId);

  syncUserToMongo(updatedUser);

  // Audit Log
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, new_value, description, ip_address)
    VALUES (?, 'USER_UPDATED', ?, ?, ?)
  `).run(actor.id, cleanEmail, `Employee details updated: ${updatedUser.name} (${updatedUser.employee_id}) by ${actor.name}`, req.ip || '127.0.0.1');

  res.json({
    message: `Employee ${updatedUser.name} updated successfully.`,
    user: updatedUser
  });
});

// PUT /api/users/:id/password (Admin or HR: Reset / Change Employee Password)
router.put('/:id/password', authenticateToken, requireRole(['ADMIN', 'HR']), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const userId = Number(req.params.id);
  const { newPassword } = req.body;

  if (!newPassword || String(newPassword).length < 4) {
    res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    return;
  }

  const target = db.prepare("SELECT id, name, username, email, employee_id FROM users WHERE id = ?").get(userId) as any;
  if (!target) {
    res.status(404).json({ error: 'Employee not found.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(String(newPassword), 10);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(passwordHash, userId);

  // Audit Log
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, new_value, description, ip_address)
    VALUES (?, 'USER_PASSWORD_RESET', ?, ?, ?)
  `).run(actor.id, target.email, `Password reset for ${target.name} (${target.employee_id}) by HR ${actor.name}`, req.ip || '127.0.0.1');

  res.json({
    message: `Password for ${target.name} has been updated successfully.`,
    username: target.username,
    email: target.email,
    newPassword: String(newPassword)
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