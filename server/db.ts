import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(process.cwd(), 'server');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'desktop_support.db');
export const db = new Database(dbPath);

// Enable foreign key enforcement & WAL journal mode for high performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initDatabase() {
  // 1. Core IT Support & Identity Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS offices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      office_name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      allowed_radius_meters INTEGER DEFAULT 500,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS work_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_name TEXT NOT NULL,
      start_time TEXT DEFAULT '09:30',
      end_time TEXT DEFAULT '18:30',
      grace_period_minutes INTEGER DEFAULT 10,
      expected_hours REAL DEFAULT 9.0,
      half_day_min_hours REAL DEFAULT 4.0,
      full_day_min_hours REAL DEFAULT 8.0,
      standard_daily_minutes INTEGER DEFAULT 540,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate users table if role check constraint doesn't allow 'HR' yet
  migrateUsersTableIfNeeded();

  // 2. Hardware & Ticketing Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_tag TEXT NOT NULL UNIQUE,
      device_name TEXT NOT NULL,
      employee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
      device_type TEXT NOT NULL,
      manufacturer TEXT,
      model TEXT,
      serial_number TEXT,
      operating_system TEXT,
      ip_address TEXT,
      cpu TEXT,
      ram TEXT,
      storage TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT NOT NULL UNIQUE,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'IN PROGRESS', 'WAITING FOR USER', 'RESOLVED', 'CLOSED')),
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
      attachment_url TEXT,
      resolution_notes TEXT,
      resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      resolution_time_seconds INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_at DATETIME,
      resolved_at DATETIME,
      closed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      assigned_to INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. HRMS Attendance & Location Tables
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      office_id INTEGER REFERENCES offices(id),
      work_schedule_id INTEGER REFERENCES work_schedules(id),
      attendance_date TEXT NOT NULL,
      punch_in_at DATETIME,
      punch_in_latitude REAL,
      punch_in_longitude REAL,
      punch_in_accuracy REAL,
      punch_out_at DATETIME,
      punch_out_latitude REAL,
      punch_out_longitude REAL,
      punch_out_accuracy REAL,
      total_work_minutes INTEGER DEFAULT 0,
      regular_work_minutes INTEGER DEFAULT 0,
      overtime_minutes INTEGER DEFAULT 0,
      late_minutes INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'HALF_DAY', 'ABSENT', 'LEAVE', 'HOLIDAY', 'WEEK_OFF', 'WORK_FROM_HOME', 'ON_DUTY', 'WORKING')),
      is_corrected INTEGER DEFAULT 0,
      correction_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, attendance_date)
    );

    CREATE TABLE IF NOT EXISTS attendance_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      attendance_id INTEGER REFERENCES attendance(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL CHECK (event_type IN ('PUNCH_IN', 'PUNCH_OUT')),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      office_id INTEGER REFERENCES offices(id),
      distance_from_office REAL NOT NULL,
      device_information TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      days_per_year REAL DEFAULT 12,
      requires_attachment INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS leave_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      allocated_days REAL NOT NULL DEFAULT 12,
      used_days REAL NOT NULL DEFAULT 0,
      remaining_days REAL NOT NULL DEFAULT 12,
      UNIQUE(employee_id, leave_type_id, year)
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      number_of_days REAL NOT NULL,
      reason TEXT NOT NULL,
      attachment_url TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      reviewed_by INTEGER REFERENCES users(id),
      review_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Shared Audit Logs & Notifications
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
      entity_type TEXT DEFAULT 'TICKET',
      entity_id INTEGER,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      description TEXT NOT NULL,
      metadata TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Team Feedback & Workplace Grievance Reporting (Direct to HR)
    CREATE TABLE IF NOT EXISTS team_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reported_against_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      category TEXT NOT NULL,
      severity TEXT DEFAULT 'MEDIUM' CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      is_anonymous INTEGER DEFAULT 0,
      status TEXT DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED', 'UNDER_REVIEW', 'ACTION_TAKEN', 'RESOLVED', 'DISMISSED')),
      hr_notes TEXT,
      reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Team Chat & Media Messages (WhatsApp-style communication, Files, Audio, Video & Calls)
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      message_text TEXT,
      message_type TEXT DEFAULT 'TEXT' CHECK(message_type IN ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'FILE', 'CALL_LOG')),
      file_url TEXT,
      file_name TEXT,
      file_size INTEGER,
      file_mime TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_chat_sender_recipient ON chat_messages(sender_id, recipient_id);
    CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages(created_at);
  `);

  seedData();
  seedHrmsData();
  seedChatData();
}

function migrateUsersTableIfNeeded() {
  // Migrate audit_logs table if columns entity_type and entity_id are missing
  try {
    const auditColumns = db.prepare("PRAGMA table_info(audit_logs)").all() as any[];
    const hasEntityType = auditColumns.some(c => c.name === 'entity_type');
    if (!hasEntityType) {
      db.exec("ALTER TABLE audit_logs ADD COLUMN entity_type TEXT DEFAULT 'TICKET';");
      db.exec("ALTER TABLE audit_logs ADD COLUMN entity_id INTEGER;");
    }
  } catch (err) {
    console.error('Audit logs migration error:', err);
  }

  // Ensure username column exists in users table
  try {
    const userColumns = db.prepare("PRAGMA table_info(users)").all() as any[];
    const hasUsername = userColumns.some(c => c.name === 'username');
    if (!hasUsername) {
      console.log('[DATABASE] Adding username column to users table...');
      db.exec("ALTER TABLE users ADD COLUMN username TEXT;");
      db.exec("UPDATE users SET username = LOWER(REPLACE(email, '@flymedia.com', '')) WHERE username IS NULL OR username = '';");
    }
  } catch (err) {
    console.error('Users table username migration error:', err);
  }

  // Ensure company_roles table exists and has initial enterprise roles
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS company_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        portal_access TEXT DEFAULT 'EMPLOYEE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const roleCount = (db.prepare("SELECT COUNT(*) as count FROM company_roles").get() as any)?.count || 0;
    if (roleCount === 0) {
      const insertRole = db.prepare("INSERT OR IGNORE INTO company_roles (name, portal_access) VALUES (?, ?)");
      const defaultRoles = [
        { name: 'Employee', access: 'EMPLOYEE' },
        { name: 'IT Engineer', access: 'IT_ENGINEER' },
        { name: 'HR Specialist', access: 'HR' },
        { name: 'System Administrator', access: 'ADMIN' },
        { name: 'Frontend Developer', access: 'EMPLOYEE' },
        { name: 'Backend Developer', access: 'EMPLOYEE' },
        { name: 'Full Stack Engineer', access: 'EMPLOYEE' },
        { name: 'UI/UX Designer', access: 'EMPLOYEE' },
        { name: 'Digital Marketing Specialist', access: 'EMPLOYEE' },
        { name: 'SEO Analyst', access: 'EMPLOYEE' },
        { name: 'Content Writer', access: 'EMPLOYEE' },
        { name: 'QA Engineer', access: 'EMPLOYEE' },
        { name: 'Product Manager', access: 'EMPLOYEE' },
        { name: 'Team Lead', access: 'EMPLOYEE' }
      ];
      for (const r of defaultRoles) {
        insertRole.run(r.name, r.access);
      }
    }
  } catch (err) {
    console.error('Company roles migration error:', err);
  }

  const tableCheck = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as any;
  if (!tableCheck) {
    // Fresh users table
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('EMPLOYEE', 'IT_ENGINEER', 'ADMIN', 'HR')),
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        employee_id TEXT UNIQUE,
        phone TEXT,
        designation TEXT,
        office_id INTEGER REFERENCES offices(id) ON DELETE SET NULL,
        work_schedule_id INTEGER REFERENCES work_schedules(id) ON DELETE SET NULL,
        joining_date TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    return;
  }

  // If table exists but lacks HR role or extra columns
  const sql = tableCheck.sql as string;
  if (!sql.includes("'HR'") || !sql.includes("designation")) {
    console.log('[DATABASE] Upgrading users table schema with HR role and employment fields...');
    db.pragma('foreign_keys = OFF');
    db.exec(`
      CREATE TABLE users_upgraded (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('EMPLOYEE', 'IT_ENGINEER', 'ADMIN', 'HR')),
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        employee_id TEXT UNIQUE,
        phone TEXT,
        designation TEXT,
        office_id INTEGER REFERENCES offices(id) ON DELETE SET NULL,
        work_schedule_id INTEGER REFERENCES work_schedules(id) ON DELETE SET NULL,
        joining_date TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO users_upgraded (id, name, email, password_hash, role, department_id, employee_id, phone, is_active, created_at, updated_at)
      SELECT id, name, email, password_hash, role, department_id, employee_id, phone, is_active, created_at, updated_at FROM users;

      DROP TABLE users;
      ALTER TABLE users_upgraded RENAME TO users;
    `);
    db.pragma('foreign_keys = ON');
    console.log('[DATABASE] Users table successfully upgraded.');
  }
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return; // Already seeded
  }

  console.log('[DATABASE] Seeding initial departments, users, systems, tickets, and audit history...');

  // 1. Departments
  const insertDept = db.prepare('INSERT INTO departments (name) VALUES (?)');
  const depts = [
    'Web Development',
    'Digital Marketing',
    'Graphic Design & UI/UX',
    'Content & SEO',
    'IT & Infrastructure',
    'HR & Operations'
  ];
  depts.forEach(d => insertDept.run(d));

  // 2. Users with hashed passwords
  const passwordHash = bcrypt.hashSync('Password@123', 10);
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department_id, employee_id, phone, designation, joining_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('System Administrator', 'admin@flymedia.com', passwordHash, 'ADMIN', 5, 'ADM-001', '+91 98765 00001', 'Chief Systems Architect', '2024-01-10');
  insertUser.run('Tanmay Kaushal', 'tanmay@flymedia.com', passwordHash, 'IT_ENGINEER', 5, 'ENG-001', '+91 98765 00002', 'Lead Desktop Support Engineer', '2024-03-15');
  insertUser.run('Jordan Lee', 'jordan@flymedia.com', passwordHash, 'IT_ENGINEER', 5, 'ENG-002', '+91 98765 00003', 'Systems Administrator L2', '2024-06-01');
  insertUser.run('Sarvesh Kumar', 'sarvesh@flymedia.com', passwordHash, 'EMPLOYEE', 2, 'EMP-101', '+91 98765 00101', 'Sr. Performance Marketer', '2024-02-01');
  insertUser.run('Manmohan Singh', 'manmohan@flymedia.com', passwordHash, 'EMPLOYEE', 1, 'EMP-102', '+91 98765 00102', 'Full Stack Developer', '2024-04-12');
  insertUser.run('Priya Patel', 'priya@flymedia.com', passwordHash, 'EMPLOYEE', 3, 'EMP-103', '+91 98765 00103', 'Lead UI/UX Designer', '2024-05-18');
  insertUser.run('Rahul Sharma', 'rahul@flymedia.com', passwordHash, 'EMPLOYEE', 4, 'EMP-104', '+91 98765 00104', 'Content & SEO Specialist', '2024-07-20');

  // 3. Systems / Devices (Matching reference: 38 Total Systems, 25 Active assignments)
  const insertDevice = db.prepare(`
    INSERT INTO devices (asset_tag, device_name, employee_id, department_id, device_type, manufacturer, model, serial_number, operating_system, ip_address, cpu, ram, storage, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDevice.run('SN33', 'DESKTOP-SARVESH', 4, 2, 'Desktop PC', 'Dell', 'OptiPlex 7070', 'DL-7070-33', 'Windows 11 Pro', '10.24.110.33', 'Intel Core i5-10400', '16 GB DDR3', '512 GB SSD', 'Active');
  insertDevice.run('SN29', 'DESKTOP-MANMOHAN', 5, 1, 'Desktop PC', 'HP', 'EliteDesk 800 G5', 'HP-800-29', 'Windows 11 Pro', '10.24.110.29', 'Intel Core i7-11700', '24 GB DDR4', '1 TB NVMe', 'Active');
  insertDevice.run('SN18', 'WS-PRIYA-DESIGN', 6, 3, 'Workstation', 'Custom Rig', 'Precision Tower', 'PR-5800-18', 'Windows 11 Pro', '10.24.110.18', 'AMD Ryzen 7 5800X', '16 GB DDR3', '1 TB NVMe + 2TB HDD', 'Active');
  insertDevice.run('SN42', 'DESKTOP-RAHUL', 7, 4, 'Desktop PC', 'Lenovo', 'ThinkCentre M720', 'LNV-M720-42', 'Windows 10 Pro', '10.24.110.42', 'Intel Core i3-10100', '12 GB DDR3', '500 GB SSD', 'Active');
  insertDevice.run('SN01', 'DEV-TANMAY-IT', 2, 5, 'Workstation', 'Custom Rig', 'IT Command Rig', 'RIG-9900-01', 'Windows 11 Enterprise', '10.24.110.1', 'Intel Core i9-13900K', '32 GB DDR5', '2 TB NVMe Gen4', 'Active');

  const ramPool = [
    { ram: '16 GB DDR3', count: 12 },
    { ram: '12 GB DDR3', count: 4 },
    { ram: '24 GB DDR4', count: 3 },
    { ram: '10 GB DDR3', count: 2 },
    { ram: '4 GB DDR3', count: 1 },
    { ram: '16 GB DDR3', count: 11 }
  ];

  let currentTag = 50;
  for (const group of ramPool) {
    for (let i = 0; i < group.count; i++) {
      currentTag++;
      const isAssigned = currentTag <= 70;
      insertDevice.run(
        `SN${currentTag}`,
        `WORKSTATION-PC-${currentTag}`,
        isAssigned ? 4 : null,
        2,
        'Desktop PC',
        'Dell',
        'OptiPlex 3080',
        `DL-3080-${currentTag}`,
        'Windows 11 Pro',
        `10.24.110.${currentTag}`,
        'Intel Core i5-11500',
        group.ram,
        '256 GB SSD',
        'Active'
      );
    }
  }

  // 4. Initial Tickets
  const insertTicket = db.prepare(`
    INSERT INTO tickets (ticket_number, created_by, assigned_to, department_id, category, priority, status, subject, description, device_id, resolution_notes, resolved_by, resolution_time_seconds, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 hours'), datetime('now', '-18 minutes'))
  `);

  insertTicket.run('IT-1024', 4, 2, 2, 'Software', 'HIGH', 'RESOLVED', 'Computer not starting / BlueScreen on startup', 1, 'Reinstalled network driver and restarted system cleanly. Diagnostic tests passed.', 2, 1067);
  insertTicket.run('IT-1023', 5, 2, 1, 'Application', 'MEDIUM', 'RESOLVED', 'Figma desktop client crashes when opening large library', 2, 'Cleared cache directory in %APPDATA%/Figma and re-authenticated.', 2, 840);

  const insertActiveTicket = db.prepare(`
    INSERT INTO tickets (ticket_number, created_by, assigned_to, department_id, category, priority, status, subject, description, device_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-45 minutes'))
  `);

  insertActiveTicket.run('IT-1025', 6, 2, 3, 'Hardware', 'CRITICAL', 'IN PROGRESS', 'Primary 4K color-accurate monitor not receiving signal', 3);
  insertActiveTicket.run('IT-1026', 7, null, 4, 'Network', 'HIGH', 'OPEN', 'Unable to connect to internal staging server 10.24.100.5', 4);

  // 5. Initial Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (ticket_id, user_id, action, old_value, new_value, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(1, 4, 'TICKET_CREATED', null, 'OPEN', 'Ticket #IT-1024 created by Sarvesh Kumar');
  insertAudit.run(1, 2, 'TICKET_ASSIGNED', null, 'Tanmay Kaushal', 'Ticket assigned to Tanmay Kaushal');
  insertAudit.run(1, 2, 'STATUS_CHANGED', 'OPEN', 'IN PROGRESS', 'Status transitioned from OPEN to IN PROGRESS');
  insertAudit.run(1, 2, 'RESOLUTION_ADDED', null, 'Reinstalled network driver', 'Resolution notes recorded: Reinstalled network driver and restarted system cleanly.');
  insertAudit.run(1, 2, 'TICKET_RESOLVED', 'IN PROGRESS', 'RESOLVED', 'Ticket marked as RESOLVED (Resolution Time: 17m 47s)');
}

function seedHrmsData() {
  // Check if offices already seeded
  const officeCount = db.prepare('SELECT COUNT(*) as count FROM offices').get() as { count: number };
  if (officeCount.count === 0) {
    console.log('[DATABASE] Seeding HRMS offices, schedules, leave types, holidays, and HR accounts...');

    // 1. Office Locations (Default: Fly Media Technology Ludhiana HQ within 500m radius)
    const insertOffice = db.prepare(`
      INSERT INTO offices (office_name, address, latitude, longitude, allowed_radius_meters, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertOffice.run('Fly Media Technology - Ludhiana HQ', 'Plot 42, IT Park / Ferozepur Road, Ludhiana, Punjab 141001', 30.9010, 75.8573, 500, 1);
    insertOffice.run('Fly Media Technology - Chandigarh Regional Hub', 'Sector 67, IT City, Mohali / Chandigarh 160062', 30.7046, 76.7179, 500, 1);

    // 2. Work Schedules (General 09:30 - 18:30, 10m grace period)
    const insertSchedule = db.prepare(`
      INSERT INTO work_schedules (schedule_name, start_time, end_time, grace_period_minutes, expected_hours, half_day_min_hours, full_day_min_hours, standard_daily_minutes, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertSchedule.run('General Day Shift', '09:30', '18:30', 10, 9.0, 4.0, 8.0, 540, 1);
    insertSchedule.run('Early Morning Shift', '08:00', '17:00', 10, 9.0, 4.0, 8.0, 540, 0);

    // 3. Leave Types
    const insertLeaveType = db.prepare(`
      INSERT INTO leave_types (name, code, days_per_year, requires_attachment, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertLeaveType.run('Casual Leave', 'CL', 12, 0, 1);
    insertLeaveType.run('Sick Leave', 'SL', 10, 1, 1);
    insertLeaveType.run('Earned Leave', 'EL', 15, 0, 1);
    insertLeaveType.run('Half Day Leave', 'HDL', 6, 0, 1);

    // 4. Holidays Calendar (2026)
    const insertHoliday = db.prepare(`
      INSERT INTO holidays (name, date, description)
      VALUES (?, ?, ?)
    `);
    insertHoliday.run('Republic Day', '2026-01-26', 'National Holiday - Celebration of the Constitution of India');
    insertHoliday.run('Holi', '2026-03-03', 'Festival of Colors');
    insertHoliday.run('Independence Day', '2026-08-15', 'National Holiday - Independence Day of India');
    insertHoliday.run('Gandhi Jayanti', '2026-10-02', 'Birth Anniversary of Mahatma Gandhi');
    insertHoliday.run('Diwali (Deepavali)', '2026-11-08', 'Festival of Lights');
    insertHoliday.run('Christmas Day', '2026-12-25', 'Christmas Celebration');
  }

  // Check if HR user exists
  const hrUser = db.prepare("SELECT * FROM users WHERE email = 'hr@flymedia.com'").get() as any;
  if (!hrUser) {
    const passwordHash = bcrypt.hashSync('Password@123', 10);
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role, department_id, employee_id, phone, designation, office_id, work_schedule_id, joining_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Simran Kaur',
      'hr@flymedia.com',
      passwordHash,
      'HR',
      6, // HR & Operations
      'HR-001',
      '+91 98765 00005',
      'Lead HR Business Partner',
      1,
      1,
      '2024-01-05'
    );
  }

  // Ensure all users have office_id = 1 and work_schedule_id = 1 assigned
  db.prepare("UPDATE users SET office_id = 1 WHERE office_id IS NULL").run();
  db.prepare("UPDATE users SET work_schedule_id = 1 WHERE work_schedule_id IS NULL").run();

  // Seed Leave Balances for all employees
  const allUsers = db.prepare("SELECT id FROM users").all() as any[];
  const leaveTypes = db.prepare("SELECT id, days_per_year FROM leave_types").all() as any[];
  const currentYear = new Date().getFullYear();

  const insertBalance = db.prepare(`
    INSERT OR IGNORE INTO leave_balances (employee_id, leave_type_id, year, allocated_days, used_days, remaining_days)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const u of allUsers) {
    for (const lt of leaveTypes) {
      insertBalance.run(u.id, lt.id, currentYear, lt.days_per_year, 0, lt.days_per_year);
    }
  }

  // Seed representative workforce attendance records so HR Dashboard shows:
  // Total Employees: 38 (or registered), Present Today: 25, Absent: 5, On Leave: 6, Half Day: 2, Overtime: 8, Late: 4
  const attendanceCount = db.prepare('SELECT COUNT(*) as count FROM attendance').get() as { count: number };
  if (attendanceCount.count === 0) {
    console.log('[DATABASE] Seeding workforce attendance records and pending leave requests...');
    const today = new Date().toISOString().split('T')[0];

    const insertAtt = db.prepare(`
      INSERT OR REPLACE INTO attendance (
        employee_id, office_id, work_schedule_id, attendance_date,
        punch_in_at, punch_in_latitude, punch_in_longitude, punch_in_accuracy,
        punch_out_at, punch_out_latitude, punch_out_longitude, punch_out_accuracy,
        total_work_minutes, regular_work_minutes, overtime_minutes, late_minutes,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Sarvesh: Punched in today at 09:28 AM, working
    insertAtt.run(
      4, 1, 1, today,
      `${today} 09:28:14`, 30.9011, 75.8572, 12.5,
      null, null, null, null,
      0, 0, 0, 0,
      'WORKING'
    );

    // Manmohan: Punched in at 09:48 AM (18 min late), punched out at 18:30 (full day)
    insertAtt.run(
      5, 1, 1, today,
      `${today} 09:48:00`, 30.9012, 75.8574, 8.0,
      `${today} 18:30:00`, 30.9010, 75.8573, 9.2,
      522, 522, 0, 18,
      'PRESENT'
    );

    // Priya: Half day (09:30 - 13:35 = 245 min)
    insertAtt.run(
      6, 1, 1, today,
      `${today} 09:30:00`, 30.9009, 75.8571, 10.0,
      `${today} 13:35:00`, 30.9010, 75.8573, 11.0,
      245, 245, 0, 0,
      'HALF_DAY'
    );

    // Rahul: On Leave today
    insertAtt.run(
      7, 1, 1, today,
      null, null, null, null,
      null, null, null, null,
      0, 0, 0, 0,
      'LEAVE'
    );

    // Seed sample pending leave request from Rahul
    db.prepare(`
      INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, number_of_days, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(7, 1, today, today, 1.0, 'Personal family commitment and urgent bank errands.', 'PENDING');
  }
}

function seedChatData() {
  const count = db.prepare("SELECT count(*) as count FROM chat_messages").get() as any;
  if (count.count === 0) {
    console.log('[DATABASE] Seeding realistic WhatsApp-style team chat messages...');
    const now = new Date();
    const tMinus = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString().replace('T', ' ').substring(0, 19);

    const insertMsg = db.prepare(`
      INSERT INTO chat_messages (
        sender_id, recipient_id, message_text, message_type,
        file_url, file_name, file_size, file_mime, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Broadcast messages in #general channel (recipient_id = NULL)
    insertMsg.run(
      1, null,
      'Welcome to Fly Media Technology Live Team Hub! 🚀 You can message any team member, share files, videos, audios, and hop on instant voice/video calls or share your PC screen.',
      'TEXT', null, null, null, null, 1, tMinus(180)
    );
    insertMsg.run(
      3, null,
      'Hey everyone! The monthly marketing campaign assets and sprint targets have been published. Great energy this week! 🙌',
      'TEXT', null, null, null, null, 1, tMinus(120)
    );

    // Tanmay (id 2) <-> Aditi Verma (id 3)
    insertMsg.run(
      3, 2,
      'Hi Tanmay! Could you check my workstation display cable? It flickers intermittently when moving the monitor.',
      'TEXT', null, null, null, null, 1, tMinus(45)
    );
    insertMsg.run(
      2, 3,
      'Hey Aditi, sure thing! I will come over with a replacement DisplayPort cable and check the GPU drivers in 10 minutes.',
      'TEXT', null, null, null, null, 1, tMinus(30)
    );
    insertMsg.run(
      3, 2,
      'Awesome, thank you Tanmay! 🙏',
      'TEXT', null, null, null, null, 1, tMinus(20)
    );

    // Tanmay (id 2) <-> Manmohan Singh (id 5)
    insertMsg.run(
      5, 2,
      'Hey Tanmay, did you deploy the latest Node & Mongo database build?',
      'TEXT', null, null, null, null, 1, tMinus(50)
    );
    insertMsg.run(
      2, 5,
      'Yes Manmohan, running live and verified on port 5000 and 27017 with live telemetry.',
      'TEXT', null, null, null, null, 1, tMinus(40)
    );
    insertMsg.run(
      5, 2,
      'Great job bro! Everything is super responsive and smooth.',
      'TEXT', null, null, null, null, 1, tMinus(15)
    );
  }
}
