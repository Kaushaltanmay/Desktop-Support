import type { Machine, Ticket, RemediationTool, KnowledgeArticle } from '../types';

export const INITIAL_MACHINES: Machine[] = [
  {
    id: 'm-1',
    hostname: 'DESKTOP-FIN-014',
    ip: '10.24.112.44',
    mac: '00:1A:2B:3C:4D:5E',
    os: 'Windows 11 Pro 23H2 (Build 22631.3296)',
    user: 'Sarah Jenkins',
    department: 'Finance & Accounting',
    cpuUsage: 94,
    ramUsage: 88,
    diskUsage: 79,
    temperatureC: 78,
    pingMs: 14,
    status: 'warning',
    lastSeen: 'Just now',
    antivirusStatus: 'Protected',
    uptimeDays: 18.4,
    model: 'Dell OptiPlex 7000 Tower',
    serialNumber: 'DL-98214-XF'
  },
  {
    id: 'm-2',
    hostname: 'ENG-CAD-089',
    ip: '10.24.115.102',
    mac: '70:85:C2:5F:8B:11',
    os: 'Windows 11 Enterprise (Workstation)',
    user: 'Alex Rivera',
    department: 'Hardware Engineering',
    cpuUsage: 42,
    ramUsage: 96,
    diskUsage: 64,
    temperatureC: 69,
    pingMs: 8,
    status: 'warning',
    lastSeen: '1m ago',
    antivirusStatus: 'Protected',
    uptimeDays: 4.1,
    model: 'HP Z4 G5 Workstation',
    serialNumber: 'HP-CAD-7732'
  },
  {
    id: 'm-3',
    hostname: 'EXEC-LAPTOP-002',
    ip: '10.24.108.15',
    mac: 'E4:54:E8:22:90:3A',
    os: 'Windows 11 Pro 24H2',
    user: 'Victoria Chen (VP Operations)',
    department: 'Executive Leadership',
    cpuUsage: 12,
    ramUsage: 38,
    diskUsage: 45,
    temperatureC: 44,
    pingMs: 12,
    status: 'online',
    lastSeen: 'Just now',
    antivirusStatus: 'Protected',
    uptimeDays: 1.2,
    model: 'Lenovo ThinkPad X1 Carbon Gen 12',
    serialNumber: 'LNV-X1-99201'
  },
  {
    id: 'm-4',
    hostname: 'KIOSK-RECEPTION-01',
    ip: '10.24.120.5',
    mac: 'A8:20:66:43:01:99',
    os: 'Windows 10 IoT Enterprise LTSC',
    user: 'Reception Terminal',
    department: 'Facilities & Security',
    cpuUsage: 0,
    ramUsage: 0,
    diskUsage: 89,
    temperatureC: 0,
    pingMs: 999,
    status: 'critical',
    lastSeen: '42m ago (Unreachable)',
    antivirusStatus: 'Outdated',
    uptimeDays: 0,
    model: 'HP Engage One Pro All-in-One',
    serialNumber: 'HP-KSK-1120'
  },
  {
    id: 'm-5',
    hostname: 'DEV-DOCKER-041',
    ip: '10.24.114.78',
    mac: 'BC:24:11:90:EE:71',
    os: 'Windows 11 Pro / WSL2 Ubuntu 24.04',
    user: 'Tanmay Kaushal',
    department: 'Core Infrastructure',
    cpuUsage: 28,
    ramUsage: 54,
    diskUsage: 41,
    temperatureC: 48,
    pingMs: 5,
    status: 'online',
    lastSeen: 'Just now',
    antivirusStatus: 'Protected',
    uptimeDays: 2.8,
    model: 'Custom Ryzen 9 7950X / 64GB DDR5',
    serialNumber: 'CS-RIG-0041'
  },
  {
    id: 'm-6',
    hostname: 'HR-PAYROLL-005',
    ip: '10.24.112.90',
    mac: '3C:52:82:11:AB:65',
    os: 'Windows 11 Enterprise',
    user: 'David Miller',
    department: 'Human Resources',
    cpuUsage: 19,
    ramUsage: 47,
    diskUsage: 58,
    temperatureC: 51,
    pingMs: 16,
    status: 'online',
    lastSeen: '2m ago',
    antivirusStatus: 'Protected',
    uptimeDays: 9.3,
    model: 'Dell Latitude 5540',
    serialNumber: 'DL-LAT-8841'
  },
  {
    id: 'm-7',
    hostname: 'SALES-BOOK-112',
    ip: '10.24.109.87',
    mac: 'F0:18:98:55:00:23',
    os: 'macOS Sequoia 15.1',
    user: 'Emily Watson',
    department: 'Global Sales',
    cpuUsage: 35,
    ramUsage: 62,
    diskUsage: 73,
    temperatureC: 55,
    pingMs: 22,
    status: 'online',
    lastSeen: 'Just now',
    antivirusStatus: 'Protected',
    uptimeDays: 6.5,
    model: 'MacBook Pro 16" M3 Pro',
    serialNumber: 'APL-MBP-9044'
  }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'INC-8921',
    title: 'BlueScreen CRITICAL_PROCESS_DIED on Finance Desktop',
    description: 'User experiences blue screen crash every 45 minutes during SAP batch processing. Machine generates kernel minidump.',
    requester: 'Sarah Jenkins',
    department: 'Finance & Accounting',
    priority: 'critical',
    status: 'in_progress',
    category: 'Hardware',
    machineId: 'm-1',
    createdAt: 'Today, 09:14 AM',
    assignedTo: 'Tanmay (Lead L2)',
    technicianNotes: [
      'Dump analysis points to stornvme.sys controller timeout.',
      'CrystalDiskInfo indicates NVMe wear level at 82%, SMART sector warnings.',
      'Scheduled drive clone and backup.'
    ]
  },
  {
    id: 'INC-8922',
    title: 'Outlook 365 permanently hanging on "Loading Profile..."',
    description: 'Outlook fails to launch in cached mode. Safe mode (outlook.exe /safe) opens but crashes when loading add-ins.',
    requester: 'David Miller',
    department: 'Human Resources',
    priority: 'high',
    status: 'open',
    category: 'OS / Software',
    machineId: 'm-6',
    createdAt: 'Today, 10:22 AM',
    assignedTo: 'Unassigned',
    technicianNotes: [
      'Likely corrupted OST file or Teams Addin registry conflict.'
    ]
  },
  {
    id: 'INC-8923',
    title: 'Dell WD19TBS dual display flickering intermittently',
    description: 'Both external 4K monitors disconnect for 2 seconds whenever a heavy GPU load starts or when USB-C dock is nudged.',
    requester: 'Alex Rivera',
    department: 'Hardware Engineering',
    priority: 'medium',
    status: 'in_progress',
    category: 'Peripherals',
    machineId: 'm-2',
    createdAt: 'Yesterday, 04:45 PM',
    assignedTo: 'Jordan Lee (L1)',
    technicianNotes: [
      'Dock firmware updated from v01.00.14 to v01.00.28.',
      'Testing Intel Graphics driver Clean Install.'
    ]
  },
  {
    id: 'INC-8924',
    title: 'BitLocker PIN request on boot after UEFI BIOS auto-update',
    description: 'Executive laptop prompted for 48-digit numerical BitLocker recovery key after Dell Command Update installed BIOS 1.14.0.',
    requester: 'Victoria Chen (VP Operations)',
    department: 'Executive Leadership',
    priority: 'critical',
    status: 'resolved',
    category: 'Access & Security',
    machineId: 'm-3',
    createdAt: 'Yesterday, 08:30 AM',
    assignedTo: 'Tanmay (Lead L2)',
    technicianNotes: [
      'Extracted recovery key from Microsoft Entra ID / Intune portal.',
      'Entered key, booted into Windows, suspended BitLocker for 1 reboot to re-seal TPM PCR registers 7 and 11.'
    ]
  },
  {
    id: 'INC-8925',
    title: 'Front Desk Kiosk Unreachable / Black Screen',
    description: 'Reception terminal is completely offline. Network switch port lights show no link activity.',
    requester: 'Reception Terminal',
    department: 'Facilities & Security',
    priority: 'high',
    status: 'open',
    category: 'Network',
    machineId: 'm-4',
    createdAt: 'Today, 11:40 AM',
    assignedTo: 'Unassigned',
    technicianNotes: [
      'Ping packets drop 100%. Suspected tripped circuit breaker or unplugged patch cable.'
    ]
  }
];

export const REMEDIATION_TOOLS: RemediationTool[] = [
  {
    id: 'tool-1',
    name: 'Flush DNS & Reset Winsock',
    category: 'Network',
    description: 'Flushes DNS resolver cache, purges ARP table, and resets the Winsock catalog back to defaults.',
    scriptCommand: 'ipconfig /flushdns ; netsh winsock reset catalog ; netsh int ip reset',
    dangerLevel: 'safe',
    typicalDuration: '3 sec'
  },
  {
    id: 'tool-2',
    name: 'Print Spooler Total Purge',
    category: 'Services',
    description: 'Force stops spoolsv service, clears all stuck .SPL and .SHD jobs from C:\\Windows\\System32\\spool\\PRINTERS, and restarts the service.',
    scriptCommand: 'Stop-Service spooler -Force ; Remove-Item "$env:SystemRoot\\System32\\spool\\PRINTERS\\*" -Force ; Start-Service spooler',
    dangerLevel: 'safe',
    typicalDuration: '5 sec'
  },
  {
    id: 'tool-3',
    name: 'Purge Windows Update Cache',
    category: 'System',
    description: 'Stops wuauserv and bits, renames SoftwareDistribution and Catroot2 folders to clear stuck corrupted update downloads.',
    scriptCommand: 'net stop wuauserv ; net stop bits ; Rename-Item "C:\\Windows\\SoftwareDistribution" "SoftwareDistribution.old" ; net start wuauserv',
    dangerLevel: 'moderate',
    typicalDuration: '12 sec'
  },
  {
    id: 'tool-4',
    name: 'Run DISM & SFC Integrity Scan',
    category: 'System',
    description: 'Repairs corrupted Windows Component Store using DISM online image and runs System File Checker to repair system DLLs.',
    scriptCommand: 'DISM.exe /Online /Cleanup-image /Restorehealth ; sfc /scannow',
    dangerLevel: 'safe',
    typicalDuration: '45 sec'
  },
  {
    id: 'tool-5',
    name: 'Purge Kerberos Tickets & Force GPO',
    category: 'Identity',
    description: 'Purges expired Kerberos authorization tickets with klist purge and immediately invokes gpupdate /force.',
    scriptCommand: 'klist purge ; gpupdate /force /target:computer /target:user',
    dangerLevel: 'safe',
    typicalDuration: '8 sec'
  },
  {
    id: 'tool-6',
    name: 'Clean User Temp & Crash Dumps',
    category: 'Storage',
    description: 'Recursively deletes files older than 24 hours in %TEMP%, C:\\Windows\\Temp, and clears Windows Error Reporting crash dumps.',
    scriptCommand: 'Get-ChildItem -Path "$env:TEMP", "C:\\Windows\\Temp" -Recurse | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) } | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue',
    dangerLevel: 'moderate',
    typicalDuration: '10 sec'
  }
];

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'kb-101',
    title: 'How to Resolve Outlook 365 Stuck on "Loading Profile"',
    category: 'Software / Email',
    readTime: '3 min read',
    summary: 'A step-by-step procedure to isolate corrupted local OST cache files and reset MAPI profiles without losing server emails.',
    recommendedCommands: [
      'outlook.exe /safe',
      'outlook.exe /cleanviews',
      'cmd /c del /f /q "%localappdata%\\Microsoft\\Outlook\\*.ost"'
    ],
    steps: [
      'Ask user to close all Office applications completely.',
      'Press Win + R and run "outlook.exe /safe" to test if third-party add-ins (Webex, Teams, Zoom) are locking initialization.',
      'Navigate to "%localappdata%\\Microsoft\\Outlook" and rename the primary cache file to user@domain.com.ost.old.',
      'Relaunch Outlook to regenerate the offline synchronization cache.'
    ]
  },
  {
    id: 'kb-102',
    title: 'BitLocker TPM Sealing & Recovery Procedure',
    category: 'Security / Encryption',
    readTime: '4 min read',
    summary: 'Diagnosing why laptops request the 48-digit recovery key after firmware/BIOS updates, and how to re-bind PCR registers.',
    recommendedCommands: [
      'manage-bde -status C:',
      'manage-bde -protectors -get C:',
      'Suspend-BitLocker -MountPoint "C:" -RebootCount 1'
    ],
    steps: [
      'Obtain BitLocker Recovery Key from Azure AD (Entra ID) portal under Devices > BitLocker keys.',
      'Have the user enter the 48-digit numeric password.',
      'Open PowerShell as Administrator once logged into Windows.',
      'Run "Suspend-BitLocker -MountPoint C: -RebootCount 1" to permit firmware PCR recalculation.',
      'Restart the workstation normally.'
    ]
  },
  {
    id: 'kb-103',
    title: 'Thunderbolt 4 & USB-C Dock Multi-Display Troubleshooting',
    category: 'Hardware / Docks',
    readTime: '5 min read',
    summary: 'Comprehensive troubleshooting steps for display flickers, black screen wake drops, and USB disconnection on Dell/HP/Lenovo docks.',
    recommendedCommands: [
      'devcon restart "USB\\ROOT_HUB30*"',
      'pnputil /enum-devices /class Display'
    ],
    steps: [
      'Check device manager for yellow exclamation marks under Universal Serial Bus controllers or Display adapters.',
      'Disable USB Selective Suspend in Windows Advanced Power Plan settings.',
      'Download and run the manufacturer Dock Firmware Utility tool directly with AC power connected.',
      'Ensure the USB-C / Thunderbolt cable is rated for 40Gbps and 100W Power Delivery.'
    ]
  }
];
