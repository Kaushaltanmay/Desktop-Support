# Fly Media Technology — Mobile App Build (Android)

Native mobile application build for **Fly Media Technology Desktop IT Support & HRMS Suite**, powered by Capacitor, Android SDK, and modern touch-optimized React components.

---

## 📱 Mobile App Overview & Feature Parity

The mobile application brings **100% of the desktop suite features** into a pocket-ready native Android client:

### 1. 💻 Desktop IT Support Operations
- **IT Task Board & Tickets:** Full triage queue, priority tagging, ticket assignment, status updates, resolution durations, and reopening.
- **Fleet Hardware Telemetry:** Real-time visibility into all 38 workstation nodes, RAM/CPU allocation, offline/online indicators, and asset tags.
- **Incident Escalation:** Raise records directly with photo attachments, hardware selection, and emergency priority.
- **Audit Log & Analytics:** Immutable audit events with timestamps, operator IDs, and resolution analytics.

### 2. 👥 HRMS & Attendance Management
- **Native Geofence Punch In / Out:** 
  - Direct GPS hardware integration (`@capacitor/geolocation` with runtime Android permissions).
  - Haversine server-side distance calculation against Fly Media Technology Ludhiana HQ (`30.9010, 75.8573`).
  - Strict 500m geofence validation.
  - Live timer tracking elapsed work hours, grace periods, and overtime calculations.
- **Attendance Triage & Live Workforce Roster:** Who is working, who is late, and audited manual adjustments.
- **Leave Entitlements & Approvals:** Casual, Sick, and Earned leave requests with instant HR approval/rejection workflows.
- **Company Holidays & Work Schedules:** Access official schedules, shift definitions, and holiday calendar.

---

## 🛠 Mobile Enhancements Built Specially for Mobile

1. **Native Touch Ergonomics (Mobile Bottom Navigation Bar):**
   - Quick bottom tab navigation (Desk, Tickets, Quick Raise `+`, Fleet/PC, More).
   - In HRMS: Punch Today, Workforce Roster, Leave Requests, Holidays, More.
   - Badge counter showing real-time active tickets.

2. **Mobile Sliding Drawer (`MobileDrawer`):**
   - 1-Click Application Switcher: `💻 IT Support` ⇄ `👥 HRMS Portal`.
   - Access to Team Directory, Departments, System Audit Logs, and Reports.
   - Authenticated user profile and quick logout.

3. **Dynamic API Server Connection Switcher (`ServerSettingsModal`):**
   - Configurable host endpoint with 1-tap presets:
     - **🏢 Office Wi-Fi / LAN:** `http://192.168.1.66:5000/api` (Default for physical Android devices)
     - **📱 Android Emulator:** `http://10.0.2.2:5000/api` (Android emulator loopback to host)
     - **💻 Local Web Browser:** `/api` (Vite dev proxy)
     - **🌐 Custom Host:** Any remote cloud URL (e.g., `https://api.flymedia.com`)
   - Built-in latency ping and `/api/health` connectivity tester.

4. **Android Native Configuration:**
   - Package ID: `com.flymedia.desktopsupport`
   - App Name: `Fly Media IT & HRMS`
   - Permissions: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `INTERNET`, `ACCESS_NETWORK_STATE`.
   - Cleartext HTTP allowed for intranet connections (`android:usesCleartextTraffic="true"`).

---

## 📦 Building and Running

### 1. Build Production Web Assets & Sync to Android
```bash
npm run mobile:sync
```

### 2. Compile Native Android APK
```bash
npm run mobile:apk
```
The output APK is generated at:
`android/app/build/outputs/apk/debug/app-debug.apk` and copied to `FlyMedia-DesktopSupport.apk`.

### 3. Open in Android Studio
```bash
npm run mobile:open
```

### 4. Running Backend Server for Mobile Access
On the host PC, ensure the Express API server is running:
```bash
npx tsx server/server.ts
```
The server binds to `0.0.0.0:5000` and allows incoming connections from mobile phones on the same Wi-Fi (`http://192.168.1.66:5000/api`).
