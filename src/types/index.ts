export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'waiting_vendor';
export type TicketCategory = 'Hardware' | 'Network' | 'OS / Software' | 'Access & Security' | 'Peripherals';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  requester: string;
  department: string;
  priority: Priority;
  status: TicketStatus;
  category: TicketCategory;
  machineId: string;
  createdAt: string;
  assignedTo: string;
  technicianNotes?: string[];
}

export type MachineStatus = 'online' | 'warning' | 'critical' | 'offline';

export interface Machine {
  id: string;
  hostname: string;
  ip: string;
  mac: string;
  os: string;
  user: string;
  department: string;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  temperatureC: number;
  pingMs: number;
  status: MachineStatus;
  lastSeen: string;
  antivirusStatus: 'Protected' | 'Outdated' | 'Disabled';
  uptimeDays: number;
  model: string;
  serialNumber: string;
}

export interface RemediationTool {
  id: string;
  name: string;
  category: 'Network' | 'System' | 'Storage' | 'Identity' | 'Services';
  description: string;
  scriptCommand: string;
  dangerLevel: 'safe' | 'moderate' | 'elevated';
  typicalDuration: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  recommendedCommands: string[];
  steps: string[];
}
