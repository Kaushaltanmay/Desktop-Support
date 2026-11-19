const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'desktop_support.db');
const db = new Database(dbPath);

console.log('--- SEEDING 5 NEW EMPLOYEES ---');

// 1. Ensure Department: Executive Management
let execDept = db.prepare("SELECT id FROM departments WHERE LOWER(name) = LOWER('Executive Management')").get();
if (!execDept) {
  const res = db.prepare("INSERT INTO departments (name) VALUES ('Executive Management')").run();
  execDept = { id: res.lastInsertRowid };
  console.log(`Created new department: Executive Management (ID: ${execDept.id})`);
} else {
  console.log(`Department Executive Management already exists (ID: ${execDept.id})`);
}

// Ensure other departments
const graphicDept = db.prepare("SELECT id FROM departments WHERE LOWER(name) LIKE '%graphic%'").get();
const hrDept = db.prepare("SELECT id FROM departments WHERE LOWER(name) LIKE '%hr%'").get();
const seoDept = db.prepare("SELECT id FROM departments WHERE LOWER(name) LIKE '%seo%' OR LOWER(name) LIKE '%content%'").get();

console.log('Department IDs:', {
  graphicDeptId: graphicDept?.id,
  hrDeptId: hrDept?.id,
  seoDeptId: seoDept?.id,
  execDeptId: execDept?.id
});

// 2. Ensure Company Roles
const rolesToAdd = [
  { name: 'Graphic Designer', portal_access: 'EMPLOYEE' },
  { name: 'HR Executive', portal_access: 'HR' },
  { name: 'Managing Director', portal_access: 'ADMIN' },
  { name: 'SEO Executive', portal_access: 'EMPLOYEE' }
];

for (const r of rolesToAdd) {
  const existing = db.prepare("SELECT id FROM company_roles WHERE LOWER(name) = LOWER(?)").get(r.name);
  if (!existing) {
    db.prepare("INSERT INTO company_roles (name, portal_access) VALUES (?, ?)").run(r.name, r.portal_access);
    console.log(`Created company role: ${r.name} (${r.portal_access})`);
  }
}

// 3. New Employees definition
const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);
const today = new Date().toISOString().split('T')[0];

const newEmployees = [
  {
    name: 'Sharad',
    username: 'sharad',
    email: 'sharad@flymedia.com',
    role: 'EMPLOYEE',
    designation: 'Graphic Designer',
    department_id: graphicDept.id,
    employee_id: 'EMP-103',
    phone: '+91 98765 00103',
    slot: 3
  },
  {
    name: 'Armaanjot',
    username: 'armaanjot',
    email: 'armaanjot@flymedia.com',
    role: 'HR',
    designation: 'HR Executive',
    department_id: hrDept.id,
    employee_id: 'HR-002',
    phone: '+91 98765 00006',
    slot: 4
  },
  {
    name: 'Anuj Gupta',
    username: 'anuj',
    email: 'anuj.gupta@flymedia.com',
    role: 'ADMIN',
    designation: 'Managing Director',
    department_id: execDept.id,
    employee_id: 'DIR-001',
    phone: '+91 98765 00010',
    slot: 5
  },
  {
    name: 'Sai',
    username: 'sai',
    email: 'sai@flymedia.com',
    role: 'EMPLOYEE',
    designation: 'SEO Executive',
    department_id: seoDept.id,
    employee_id: 'EMP-104',
    phone: '+91 98765 00104',
    slot: 6
  },
  {
    name: 'Parth',
    username: 'parth',
    email: 'parth@flymedia.com',
    role: 'EMPLOYEE',
    designation: 'SEO Executive',
    department_id: seoDept.id,
    employee_id: 'EMP-105',
    phone: '+91 98765 00105',
    slot: 7
  }
];

const leaveTypes = db.prepare("SELECT id, days_per_year FROM leave_types WHERE is_active = 1").all();
const currentYear = new Date().getFullYear();

for (const emp of newEmployees) {
  let user = db.prepare("SELECT id FROM users WHERE email = ?").get(emp.email);
  let userId;
  if (user) {
    console.log(`User ${emp.name} (${emp.email}) already exists with ID: ${user.id}, updating...`);
    userId = user.id;
    db.prepare(`
      UPDATE users SET
        name = ?,
        username = ?,
        role = ?,
        department_id = ?,
        employee_id = ?,
        phone = ?,
        designation = ?,
        office_id = 1,
        work_schedule_id = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(emp.name, emp.username, emp.role, emp.department_id, emp.employee_id, emp.phone, emp.designation, userId);
  } else {
    const res = db.prepare(`
      INSERT INTO users (
        name, username, email, password_hash, role, department_id,
        employee_id, phone, designation, office_id, work_schedule_id,
        joining_date, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, 1)
    `).run(
      emp.name,
      emp.username,
      emp.email,
      defaultPasswordHash,
      emp.role,
      emp.department_id,
      emp.employee_id,
      emp.phone,
      emp.designation,
      today
    );
    userId = res.lastInsertRowid;
    console.log(`Created User: ${emp.name} (ID: ${userId}, Username: ${emp.username}, Role: ${emp.role})`);
  }

  // Seed Leave Balances
  for (const lt of leaveTypes) {
    db.prepare(`
      INSERT OR IGNORE INTO leave_balances (employee_id, leave_type_id, year, allocated_days, used_days, remaining_days)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(userId, lt.id, currentYear, lt.days_per_year, lt.days_per_year);
  }

  // Map Biometric Fingerprint Slot
  db.prepare(`
    INSERT INTO fingerprint_mappings (employee_id, device_id, fingerprint_slot, is_active)
    VALUES (?, 'DEVICE001', ?, 1)
    ON CONFLICT(device_id, fingerprint_slot) DO UPDATE SET
      employee_id = excluded.employee_id,
      is_active = 1,
      enrolled_at = CURRENT_TIMESTAMP
  `).run(userId, emp.slot);
  console.log(`Mapped ${emp.name} to R307 Slot #${emp.slot} on DEVICE001`);
}

// Also map existing employees to slots if not mapped
const existingMappings = [
  { userId: 2, slot: 1, name: 'Tanmay Kaushal' },
  { userId: 5, slot: 2, name: 'Manmohan Singh' },
  { userId: 9, slot: 8, name: 'Simran Kaur' },
  { userId: 1, slot: 9, name: 'System Administrator' }
];

for (const em of existingMappings) {
  const u = db.prepare("SELECT id FROM users WHERE id = ?").get(em.userId);
  if (u) {
    db.prepare(`
      INSERT INTO fingerprint_mappings (employee_id, device_id, fingerprint_slot, is_active)
      VALUES (?, 'DEVICE001', ?, 1)
      ON CONFLICT(device_id, fingerprint_slot) DO UPDATE SET
        employee_id = excluded.employee_id,
        is_active = 1,
        enrolled_at = CURRENT_TIMESTAMP
    `).run(em.userId, em.slot);
    console.log(`Mapped existing user ${em.name} (ID: ${em.userId}) to Slot #${em.slot}`);
  }
}

console.log('\n--- VERIFICATION OF ALL USERS IN SQLITE ---');
const allUsers = db.prepare(`
  SELECT u.id, u.name, u.username, u.email, u.role, u.designation, d.name as department_name, u.employee_id,
         fm.fingerprint_slot
  FROM users u
  LEFT JOIN departments d ON u.department_id = d.id
  LEFT JOIN fingerprint_mappings fm ON fm.employee_id = u.id AND fm.device_id = 'DEVICE001'
  ORDER BY u.id ASC
`).all();
console.table(allUsers);

db.close();
console.log('\nSQLite seeding complete!');
