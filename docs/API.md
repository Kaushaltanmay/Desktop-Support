# Desktop IT Support - REST API Documentation

**Desktop IT Support** is an API-first internal IT helpdesk and endpoint operations management platform built for Fly Media Technology. All business logic and operations are fully exposed through RESTful JSON APIs, enabling seamless integration with the web client as well as future **iOS and Android mobile applications** (e.g., React Native / Expo, Flutter, or native Swift/Kotlin).

---

## 1. Architecture & Design Principles

- **Base URL (Local Development):** `http://localhost:5000/api` (or proxied via `/api` in Vite)
- **Protocol:** HTTP/1.1 or HTTP/2 over TLS in production
- **Format:** `application/json`
- **Authentication:** Bearer JWT in the `Authorization` header: `Authorization: Bearer <TOKEN>`
- **Role-Based Access Control (RBAC):**
  - `EMPLOYEE`: Access to their own profile, assigned workstation, raising tickets, viewing their tickets, commenting, and reopening.
  - `IT_ENGINEER`: Full access to ticket queue, assignments, resolution workflows, device inventory, telemetry, and reports.
  - `ADMIN`: Full administrative control including employee provisioning, user access control, and complete immutable system audit logs.

---

## 2. Authentication Endpoints

### 2.1 Login
`POST /api/auth/login`
- **Description:** Authenticates user and returns JWT session token with profile information.
- **Request Body:**
  ```json
  {
    "email": "sarvesh@flymedia.com",
    "password": "Password@123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 4,
      "name": "Sarvesh Kumar",
      "email": "sarvesh@flymedia.com",
      "role": "EMPLOYEE",
      "department_id": 2,
      "employee_id": "EMP-101",
      "phone": "+91 98765 00101"
    }
  }
  ```

### 2.2 Get Current User
`GET /api/auth/me`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": 2,
      "name": "Tanmay Kaushal",
      "email": "tanmay@flymedia.com",
      "role": "IT_ENGINEER",
      "department_id": 5,
      "employee_id": "ENG-001"
    }
  }
  ```

### 2.3 Logout
`POST /api/auth/logout`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (200 OK):** `{"message": "Logged out successfully"}`

---

## 3. Dashboard & Telemetry Endpoints

### 3.1 Get Dashboard Statistics
`GET /api/dashboard/stats`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Behavior:** Returns role-tailored operational data.
  - For `EMPLOYEE`: Personal ticket count (`totalTickets`, `openTickets`, `pendingTickets`, `resolvedTickets`), recent tickets, and assigned workstation hardware specs.
  - For `IT_ENGINEER` / `ADMIN`: Global hardware distribution (RAM horizontal bars matching reference screenshot), status breakdown (Doughnut chart), active complaints queue sorted by priority (`CRITICAL` -> `HIGH` -> `MEDIUM` -> `LOW`), recently resolved cards with resolution notes and calculated turnaround times.

---

## 4. Tickets API

### 4.1 List Tickets
`GET /api/tickets`
- **Query Parameters (Optional):**
  - `status`: Filter by `OPEN`, `IN PROGRESS`, `WAITING FOR USER`, `RESOLVED`, `CLOSED`
  - `priority`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - `category`: `Hardware`, `Software`, `Network`, `Email`, etc.
  - `department_id`: Numeric department filter
  - `assigned_to`: Engineer user ID
  - `search`: Full-text substring search on subject, description, ticket number, or requester
  - `sortBy`: `newest`, `oldest`, `priority`, `last_updated`
- **Response (200 OK):**
  ```json
  {
    "tickets": [
      {
        "id": 5,
        "ticket_number": "IT-1027",
        "created_by": 4,
        "creator_name": "Sarvesh Kumar",
        "creator_email": "sarvesh@flymedia.com",
        "category": "Network",
        "priority": "HIGH",
        "status": "IN PROGRESS",
        "subject": "Wi-Fi disconnects frequently during video calls",
        "description": "The connection drops every 10 minutes on workstation SN33 in marketing bay.",
        "asset_tag": "SN33",
        "assigned_to": 2,
        "assignee_name": "Tanmay Kaushal",
        "created_at": "2026-09-26T07:25:28.000Z",
        "updated_at": "2026-09-26T07:25:29.000Z"
      }
    ]
  }
  ```

### 4.2 Get Ticket Details & Timeline
`GET /api/tickets/:id`
- **Response (200 OK):**
  ```json
  {
    "ticket": {
      "id": 5,
      "ticket_number": "IT-1027",
      "subject": "Wi-Fi disconnects frequently during video calls",
      "description": "The connection drops...",
      "status": "RESOLVED",
      "priority": "HIGH",
      "resolution_notes": "Updated Intel Wi-Fi 6 driver to v22.190 and flushed DNS cache.",
      "resolution_time_formatted": "17m 47s",
      "created_at": "...",
      "resolved_at": "..."
    },
    "comments": [
      {
        "id": 12,
        "user_name": "Tanmay Kaushal",
        "comment": "Analyzing network adapter driver logs and switch telemetry for port 24.",
        "created_at": "..."
      }
    ],
    "history": [
      {
        "id": 8,
        "old_status": "OPEN",
        "new_status": "IN PROGRESS",
        "actor_name": "Tanmay Kaushal",
        "created_at": "..."
      }
    ],
    "audits": [ ... ]
  }
  ```

### 4.3 Raise Support Ticket
`POST /api/tickets`
- **Request Body:**
  ```json
  {
    "category": "Hardware",
    "priority": "HIGH",
    "subject": "Secondary monitor flickering",
    "description": "DisplayPort connection goes black every few seconds.",
    "device_id": 1,
    "attachment_url": null
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Ticket created successfully",
    "ticketNumber": "IT-1030",
    "ticket": { ... }
  }
  ```

### 4.4 Assign Ticket
`POST /api/tickets/:id/assign`
- **Roles:** `IT_ENGINEER`, `ADMIN`
- **Request Body:** `{"assigned_to": 2}`
- **Side Effects:** Automatically transitions ticket from `OPEN` to `IN PROGRESS`, writes immutable audit record `TICKET_ASSIGNED`, and triggers in-app notification for the ticket creator.

### 4.5 Add Comment / Reply
`POST /api/tickets/:id/comments`
- **Request Body:** `{"comment": "I have verified the cable replacement resolved the issue."}`
- **Side Effects:** Writes audit log `ENGINEER_REPLIED` or `COMMENT_ADDED`, sends in-app notification to the counterpart.

### 4.6 Resolve Ticket
`POST /api/tickets/:id/resolve`
- **Roles:** `IT_ENGINEER`, `ADMIN`
- **Request Body:**
  ```json
  {
    "resolution_notes": "Replaced faulty DisplayPort 1.4 cable with tested Gold-plated OEM cable."
  }
  ```
- **Side Effects:** Calculates exact elapsed resolution turnaround (e.g., `1h 18m`), updates `resolved_at`, writes audit log `TICKET_RESOLVED`, notifies employee.

### 4.7 Reopen Ticket
`POST /api/tickets/:id/reopen`
- **Request Body:** `{"reason": "Flickering resumed after connecting to 4K monitor."}`
- **Side Effects:** Sets status to `IN PROGRESS`, logs audit event `TICKET_REOPENED`, notifies assigned engineer.

---

## 5. Device & Systems Inventory API

### 5.1 List Systems
`GET /api/devices`
- **Query Parameters:** `search`, `status`, `department_id`
- **Response (200 OK):**
  ```json
  {
    "devices": [
      {
        "id": 1,
        "asset_tag": "SN33",
        "device_name": "DESKTOP-SARVESH",
        "employee_name": "Sarvesh Kumar",
        "department_name": "Digital Marketing",
        "device_type": "Desktop PC",
        "manufacturer": "Dell",
        "model": "OptiPlex 7070",
        "cpu": "Intel Core i5-10400",
        "ram": "16 GB DDR3",
        "storage": "512 GB SSD",
        "operating_system": "Windows 11 Pro",
        "ip_address": "10.24.110.33",
        "status": "Active"
      }
    ]
  }
  ```

### 5.2 Create / Provision Device
`POST /api/devices`
- **Roles:** `IT_ENGINEER`, `ADMIN`
- **Request Body:**
  ```json
  {
    "asset_tag": "SN99",
    "device_name": "DESKTOP-DEV-01",
    "employee_id": 4,
    "department_id": 2,
    "device_type": "Workstation",
    "manufacturer": "Dell",
    "model": "Precision 3650",
    "cpu": "Intel Core i7-12700",
    "ram": "32 GB DDR4",
    "storage": "1 TB NVMe SSD",
    "operating_system": "Windows 11 Pro",
    "ip_address": "10.24.110.99",
    "status": "Active"
  }
  ```

---

## 6. Immutable Audit Trail API

### 6.1 Query Audit Logs
`GET /api/audit-logs`
- **Roles:** `IT_ENGINEER`, `ADMIN`
- **Query Parameters:** `ticket_id`, `action`, `search`, `limit`
- **Response (200 OK):**
  ```json
  {
    "auditLogs": [
      {
        "id": 14,
        "ticket_id": 5,
        "ticket_number": "IT-1027",
        "action": "TICKET_RESOLVED",
        "user_name": "Tanmay Kaushal",
        "description": "Ticket resolved by Tanmay Kaushal (17m 47s). Resolution: Updated Intel Wi-Fi 6 driver...",
        "created_at": "2026-09-26T07:25:29.000Z"
      }
    ]
  }
  ```

---

## 7. Reports & SLA Metrics API

### 7.1 Get Reports
`GET /api/reports?timeframe=30days`
- **Timeframes:** `today`, `7days`, `30days`, `90days`, `all`
- **Response (200 OK):**
  - `summary`: `totalTickets`, `resolvedTickets`, `openTickets`, `avgResolutionTimeSeconds`, `avgResolutionFormatted`, `slaRate`
  - `byCategory`: Breakdown of issues across Hardware, Network, Windows, Application, etc.
  - `byPriority`: Distribution across Low, Medium, High, Critical
  - `engineerWorkload`: Tickets handled, resolved, and pending per technician

---

---

## 8. HRMS & Geolocation Attendance API

### 8.1 Punch In (Employee)
`POST /api/attendance/punch-in`
- **Roles:** `EMPLOYEE`, `HR`, `IT_ENGINEER`, `ADMIN`
- **Request Body:**
  ```json
  {
    "latitude": 30.9010,
    "longitude": 75.8573,
    "accuracy": 10.0,
    "device_information": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"
  }
  ```
- **Validation:**
  - Calculates Haversine distance server-side against employee's assigned office.
  - Requires distance `<= allowed_radius_meters` (Default: 500m).
  - Enforces single punch in per working day.
  - Auto-calculates `late_minutes` beyond schedule grace period (09:40 AM).
- **Response (200 OK):**
  ```json
  {
    "message": "Punched in successfully at 09:28 AM.",
    "distanceMeters": 14,
    "lateMinutes": 0,
    "attendance": { ... }
  }
  ```

### 8.2 Punch Out (Employee)
`POST /api/attendance/punch-out`
- **Request Body:**
  ```json
  {
    "latitude": 30.9011,
    "longitude": 75.8574,
    "accuracy": 8.0
  }
  ```
- **Side Effects:** Server verifies `<= 500m`, calculates total work duration, regular hours, overtime (duration exceeding 9h / 540 min), status (`PRESENT`, `HALF_DAY`, or `ABSENT`), records immutable event in `attendance_events`, logs audit trail.
- **Response (200 OK):**
  ```json
  {
    "message": "Punched out successfully.",
    "totalWorkMinutes": 540,
    "formattedWorkHours": "9h 00m",
    "formattedOvertime": "0h 00m",
    "status": "PRESENT",
    "distanceMeters": 18
  }
  ```

### 8.3 Get Today's Status
`GET /api/attendance/today`
- **Response (200 OK):**
  ```json
  {
    "today": "2026-09-26",
    "workingStatus": "WORKING",
    "attendance": { ... },
    "office": {
      "office_name": "Fly Media Technology - Ludhiana HQ",
      "latitude": 30.9010,
      "longitude": 75.8573,
      "allowed_radius_meters": 500
    }
  }
  ```

### 8.4 My Attendance History
`GET /api/attendance/me?month=2026-09`
- **Response (200 OK):**
  - `summary`: `presentDays`, `halfDays`, `leaveDays`, `absentDays`, `overtimeMinutes`, `overtimeFormatted`
  - `records`: List of daily logs with punch in/out timestamps, hours, and status badges.

### 8.5 Workforce Attendance Roster & Filters (HR)
`GET /api/attendance`
- **Roles:** `HR`, `ADMIN`
- **Query Parameters:** `date`, `employee_id`, `department_id`, `status`, `search`
- **Response (200 OK):** Array of all workforce attendance records with employee details and GPS coordinates.

### 8.6 Audited Attendance Correction (HR)
`PATCH /api/attendance/:id/correct`
- **Roles:** `HR`, `ADMIN`
- **Request Body:**
  ```json
  {
    "status": "PRESENT",
    "reason": "Employee had approved off-site client deployment."
  }
  ```
- **Side Effects:** Writes immutable record in `audit_logs` with old value, new value, and justification reason. Dispatches in-app notification to employee.

---

## 9. Leave Management API

### 9.1 Leave Balances
`GET /api/leaves/balances`
- **Response (200 OK):**
  ```json
  {
    "year": 2026,
    "balances": [
      { "leave_type_name": "Casual Leave", "leave_type_code": "CL", "allocated_days": 12, "used_days": 2, "remaining_days": 10 },
      { "leave_type_name": "Sick Leave", "leave_type_code": "SL", "allocated_days": 10, "used_days": 0, "remaining_days": 10 }
    ]
  }
  ```

### 9.2 Apply for Leave
`POST /api/leaves/apply`
- **Request Body:**
  ```json
  {
    "leave_type_id": 1,
    "start_date": "2026-10-15",
    "end_date": "2026-10-16",
    "reason": "Family wedding event."
  }
  ```

### 9.3 HR Leave Approval / Rejection
`PATCH /api/leaves/:id/approve` or `PATCH /api/leaves/:id/reject`
- **Roles:** `HR`, `ADMIN`
- **Request Body:** `{"review_comment": "Approved by HR Simran"}`
- **Side Effects:** Auto-deducts days from `leave_balances`, logs `LEAVE_APPROVED` / `LEAVE_REJECTED` in `audit_logs`, and sends real-time in-app notification to the employee.

---

## 10. HR Dashboard & Telemetry API

`GET /api/hr/dashboard`
- **Roles:** `HR`, `ADMIN`, `IT_ENGINEER`
- **Response (200 OK):**
  ```json
  {
    "today": "2026-09-26",
    "metrics": {
      "totalEmployees": 38,
      "presentToday": 25,
      "absentToday": 5,
      "onLeaveToday": 6,
      "halfDayToday": 2,
      "overtimeToday": 8,
      "lateToday": 4,
      "pendingLeaveRequests": 1
    },
    "todayRoster": [ ... ]
  }
  ```

---

## 11. Mobile App Integration Guide (React Native / Expo)

The unified REST API decouples business logic from client devices:
1. **Attendance Punch:** Use `expo-location` (`Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })`) to acquire device coordinates and forward to `POST /api/attendance/punch-in`.
2. **Offline & Edge Handling:** Backend returns explicit status codes and distance readouts (e.g. `You are 2.4 km away from office`).
3. **Session & Security:** Store Bearer JWT in `expo-secure-store`.

