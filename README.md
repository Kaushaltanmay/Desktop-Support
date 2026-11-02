# Desktop IT Support & HRMS — Fly Media Technology

A unified, full-stack enterprise operations platform built specifically for **Fly Media Technology**, combining two core business systems under a single identity and database:

1. **💻 Desktop IT Support**: IT Helpdesk, Workstation Hardware Telemetry (38 Systems, RAM distribution, asset tags `SN33`, `SN29`, `SN01`), Incident Triage, Remote Resolution, and Turnaround Timelines.
2. **👥 HRMS & Attendance Portal**: Biometric & GPS Geofence Punch In / Punch Out (Strict 500m office boundary), Work Schedules & Grace Periods, Overtime & Late Tracking, Leave Quota Management & HR Approvals, Workforce Live Roster, and Audited Corrections.

---

## 🌟 Visual & Architectural Highlights

- **Fly Media Technology Brand Identity:** Clean modern SaaS design system with authentic company logo ([`public/flymedia_logo.png`](file:///c:/Tanmay/Desktop%20Support/public/flymedia_logo.png)), rounded cards (`border-radius: 14px`), soft shadows, and vibrant status badges.
- **Unified Identity & Single Sign-On:** Both the IT Desk and HRMS share the exact same user identity, database, and notifications. An employee can punch in and raise an IT ticket without logging into separate accounts!
- **1-Click App Switcher:** The top header features a smooth application switcher allowing staff and employees to toggle between **"💻 IT Support"** and **"👥 HR Portal"** instantly.
- **Strict Server-Side Geofencing:**
  - Independent Haversine distance validation on the backend.
  - Requires employee to be within **500 meters** of the registered office (Fly Media Technology Ludhiana HQ: `30.9010, 75.8573`).
  - Outside 500m requests are automatically rejected with exact distance readouts.
- **Immutable Audit Trail:** All ticket actions, hardware additions, attendance events, HR manual corrections, and leave decisions are permanently logged in the `audit_logs` table.
- **Mobile-Ready REST APIs:** Built decoupled for web and future **React Native / Expo** mobile applications.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22.14.0)
- **Package Manager**: npm

### 2. Installation
```bash
# Navigate to the repository
cd "Desktop Support"

# Install dependencies
npm install
```

### 3. Running the Platform

In two terminal windows:

#### Terminal 1: Backend API Server (Port 5000)
```bash
npx tsx server/server.ts
```
The server will initialize the SQLite database with WAL mode (`server/desktop_support.db`), foreign keys, and seed all departments, employees, 38 workstations, office locations, work schedules, leave balances, and holidays.

#### Terminal 2: Frontend Web App (Port 5173)
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 👥 Demo Accounts (Ready to Test)

The login screen includes **1-Click Demo Profile Switchers**:

| Role | Name | Email | Password | Primary Desk |
|---|---|---|---|---|
| **HR Lead (Operations)** | Simran Kaur | `hr@flymedia.com` | `Password@123` | HR Management Portal |
| **IT Engineer (Lead)** | Tanmay Kaushal | `tanmay@flymedia.com` | `Password@123` | IT Operations Command |
| **System Admin** | System Administrator | `admin@flymedia.com` | `Password@123` | Global Administration |
| **Employee** | Sarvesh Kumar | `sarvesh@flymedia.com` | `Password@123` | Digital Marketing bay (`SN33`) |
| **Employee** | Manmohan Singh | `manmohan@flymedia.com` | `Password@123` | Web Development bay (`SN29`) |
| **Employee** | Priya Patel | `priya@flymedia.com` | `Password@123` | UI/UX Design tower (`SN18`) |

---

## 🧪 Automated Verification Test Suites

Both applications feature complete end-to-end automated test suites:

### 1. Desktop IT Support Test Suite
Verifies ticket creation, IT engineer triage, ticket assignment, employee notifications, resolution turnaround duration calculation, ticket reopening, and device provisioning:
```bash
npx tsx test_flows.ts
```

### 2. HRMS & Geolocation Attendance Test Suite
Verifies 500m geofence rejection, inside-boundary punch in, single punch-in enforcement, working duration & overtime calculation, leave application, leave balance deduction, HR approvals, and manual audited attendance corrections:
```bash
npx tsx test_hrms_backend.ts
```

### 3. Production Build Validation
```bash
npm run build
```

---

## 📱 Mobile App Build (Android APK & Capacitor Native)

The mobile application build is 100% feature-complete with the desktop suite, featuring:
- **Direct APK Installation:** Ready-to-install Android APK: [`FlyMedia-DesktopSupport.apk`](file:///c:/Tanmay/Desktop%20Support/FlyMedia-DesktopSupport.apk) (4.99 MB).
- **Native Geolocation Punch In:** Hardware GPS positioning via `@capacitor/geolocation` validating 500m office boundaries.
- **Mobile Touch Navigation:** Bottom tab bar (`MobileBottomNav`) and off-canvas sliding drawer (`MobileDrawer`).
- **Dynamic API Host Switcher:** 1-tap switching between Office LAN (`http://192.168.1.66:5000/api`), Android Emulator (`http://10.0.2.2:5000/api`), and custom hosts with latency test.
- **Full Architecture Documentation:** See [`docs/MOBILE_APP.md`](file:///c:/Tanmay/Desktop%20Support/docs/MOBILE_APP.md).

### Mobile Commands:
```bash
# Sync web build to Android native project
npm run mobile:sync

# Compile fresh Android APK (assembleDebug)
npm run mobile:apk

# Open native project in Android Studio
npm run mobile:open
```

---

*Fly Media Technology Internal Operations Platform • Desktop IT Support & HRMS Suite*
