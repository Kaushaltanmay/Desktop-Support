# 🛠️ Desktop Support Command Center

> Enterprise IT Fleet Telemetry, Real-Time Hardware Diagnostics, Incident Ticket Queue & Automated Remediation Console.

---

## ⚡ Features Overview

- 💻 **Fleet & Hardware Telemetry**:
  - Live CPU, Memory (RAM), Disk usage, Temperature (°C), and Ping latency telemetry meters.
  - Endpoint health classification (`Online`, `Warning`, `Critical`, `Offline`).
  - Deep Endpoint Diagnostics modal with one-click remote RPC actions:
    - Host Ping Latency Test
    - DNS Resolver Cache Flush
    - Print Spooler Total Purge & Restart
    - DxDiag & Hardware Spec Exporter
- 🎫 **Incidents & Ticket Dispatch Queue**:
  - Multi-tier filtering by Status (`Open`, `In Progress`, `Waiting Vendor`, `Resolved`), Priority (`Critical`, `High`, `Medium`, `Low`), and Category (`Hardware`, `Network`, `OS / Software`, `Access & Security`, `Peripherals`).
  - Interactive ticket inspection drawer with live technician notes log.
  - Direct incident creation modal with device assignment and urgency classification.
- ⚡ **Automated Support Runbooks (Remediation Toolbox)**:
  - 1-click remediation scripts for Windows workstation issues (Winsock reset, Print spooler purge, SoftwareDistribution cache wipe, DISM & SFC scans, Kerberos ticket reset).
  - Streaming simulated remote PowerShell execution console.
  - One-click script command clipboard copier.
- 💻 **Live IT Terminal (Interactive PowerShell CLI Emulator)**:
  - Built-in floating terminal console.
  - Supports diagnostic commands: `help`, `ping <ip>`, `ipconfig`, `ipconfig /all`, `flushdns`, `systeminfo`, `sfc /scannow`, `gpupdate /force`, `get-service`, `netstat`, `whoami`, `clear`.
  - Command history navigation (Up / Down arrow keys).
- 📊 **SLA Compliance & Service Desk Analytics**:
  - Live SLA Compliance rate (96.4%), MTTA (3.2 min), MTTR (16.8 min), and CSAT (98.9%).
  - Category workload distribution breakdown.
  - Desktop Support technician leaderboard.
- 📚 **Knowledge Base & Standard Operating Procedures (SOPs)**:
  - Searchable troubleshooting procedures for BitLocker recovery loops, Outlook loading hangs, docking station flickers, and display driver clean installs.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (tested on Node v22.14.0)
- npm / yarn / pnpm

### Installation

```bash
# Clone or navigate to the directory
cd "Desktop Support"

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🏗️ Tech Stack

- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Cyber-Glassmorphism Custom Design Tokens (Vanilla CSS)
- **Typography**: Google Fonts (`Outfit` + `JetBrains Mono`)
- **Icons**: Lucide React
- **Version Control**: Git

---

*Engineered by Kaushaltanmay • Desktop Support Operations*
