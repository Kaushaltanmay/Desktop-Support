import React from 'react';
import { 
  LayoutGrid, 
  CheckSquare, 
  Users, 
  Building2, 
  HardDrive, 
  Tag, 
  FileText, 
  BarChart3, 
  User, 
  PlusCircle, 
  Bell, 
  Laptop, 
  LifeBuoy,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  portalMode: 'ENGINEER' | 'EMPLOYEE' | 'HR';
  onTogglePortal: () => void;
  canSwitchPortal: boolean;
  ticketCount?: number;
  activeApp: 'IT_SUPPORT' | 'HRMS';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  portalMode,
  onTogglePortal,
  canSwitchPortal,
  ticketCount,
  activeApp
}) => {
  // Navigation for IT Engineer
  const engineerNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'tickets', label: 'Task Board', icon: CheckSquare, badge: ticketCount },
    { id: 'employees', label: 'Team Directory', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'devices', label: 'Systems Inventory', icon: HardDrive },
    { id: 'raise-ticket', label: 'Raise Records', icon: Tag },
    { id: 'audit', label: 'System Logs & Audit', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  // Navigation for IT Employee
  const itEmployeeNav = [
    { id: 'emp-dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'emp-tickets', label: 'My Tickets', icon: CheckSquare, badge: ticketCount },
    { id: 'raise-ticket', label: 'Raise Ticket', icon: PlusCircle },
    { id: 'emp-profile', label: 'My Profile & PC', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  // Navigation for HR Staff
  const hrNav = [
    { id: 'hrms-dashboard', label: 'HR Dashboard', icon: LayoutGrid },
    { id: 'hrms-attendance', label: 'Attendance Triage', icon: CheckSquare },
    { id: 'hrms-leaves', label: 'Leave Requests', icon: Calendar },
    { id: 'employees', label: 'Employees Directory', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'hrms-schedules', label: 'Work Schedules', icon: Clock },
    { id: 'hrms-holidays', label: 'Company Holidays', icon: Calendar },
    { id: 'audit', label: 'HR Audit Trail', icon: FileText },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  // Navigation for HRMS Employee
  const hrmsEmployeeNav = [
    { id: 'hrms-dashboard', label: 'Today & Punch', icon: LayoutGrid },
    { id: 'hrms-my-attendance', label: 'My Attendance', icon: CheckSquare },
    { id: 'hrms-leaves', label: 'Leave Entitlements', icon: Calendar },
    { id: 'hrms-holidays', label: 'Holiday Calendar', icon: Calendar },
    { id: 'emp-profile', label: 'My Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  let navItems = engineerNav;
  if (activeApp === 'HRMS') {
    navItems = portalMode === 'EMPLOYEE' ? hrmsEmployeeNav : hrNav;
  } else {
    navItems = portalMode === 'EMPLOYEE' ? itEmployeeNav : engineerNav;
  }

  return (
    <aside style={{
      width: '260px',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0
    }}>
      <div>
        {/* Top Fly Media Technology Logo */}
        <div style={{ padding: '0 8px 28px', display: 'flex', alignItems: 'center' }}>
          <img
            src="/flymedia_logo.png"
            alt="Fly Media Technology"
            style={{ width: '190px', objectFit: 'contain' }}
          />
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#0284c7' : '#334155',
                  background: isActive ? '#e0f2fe' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} color={isActive ? '#0284c7' : '#64748b'} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: isActive ? '#0284c7' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#64748b'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: "Employee Portal" switch matching Screenshot 2026-09-26 121847.png */}
      {canSwitchPortal && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} color="#0284c7" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0284c7' }}>
              Employee Portal
            </span>
          </div>

          {/* iOS-style toggle switch */}
          <button
            onClick={onTogglePortal}
            style={{
              width: '38px',
              height: '20px',
              borderRadius: '20px',
              backgroundColor: portalMode === 'EMPLOYEE' ? '#0284c7' : '#cbd5e1',
              position: 'relative',
              cursor: 'pointer',
              padding: '2px',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              transform: portalMode === 'EMPLOYEE' ? 'translateX(18px)' : 'translateX(0)',
              transition: 'transform 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>
      )}
    </aside>
  );
};
