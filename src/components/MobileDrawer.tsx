import React from 'react';
import { 
  X, 
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
  Calendar, 
  Clock, 
  LogOut, 
  Server, 
  Repeat, 
  Shield,
  MessageSquareWarning,
  MessageCircle,
  Fingerprint
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: any;
  onLogout: () => void;
  activeApp: 'IT_SUPPORT' | 'HRMS';
  onSwitchApp: (app: 'IT_SUPPORT' | 'HRMS') => void;
  portalMode: 'ENGINEER' | 'EMPLOYEE' | 'HR';
  onTogglePortal: () => void;
  canSwitchPortal: boolean;
  onOpenServerSettings: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  activeApp,
  onSwitchApp,
  portalMode,
  onTogglePortal,
  canSwitchPortal,
  onOpenServerSettings,
  onOpenNotifications,
  unreadCount
}) => {
  if (!isOpen) return null;

  const handleSelect = (tab: string) => {
    onSelectTab(tab);
    onClose();
  };

  const initial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex'
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)'
        }}
      />

      {/* Drawer Content */}
      <div style={{
        position: 'relative',
        width: '84%',
        maxWidth: '320px',
        height: '100%',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 201,
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '18px 20px',
          paddingTop: 'max(42px, env(safe-area-inset-top, 0px))',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/flymedia_logo.png" alt="Fly Media" style={{ height: '30px' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
              Operations Suite
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px',
              borderRadius: '8px',
              color: '#64748b'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#ffffff'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1rem'
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.name || 'Authorized User'}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              {currentUser?.role} • {currentUser?.department || 'Fly Media HQ'}
            </div>
          </div>
        </div>

        {/* App Switcher Banner */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Active Application Suite
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => {
                onSwitchApp('IT_SUPPORT');
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: activeApp === 'IT_SUPPORT' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                background: activeApp === 'IT_SUPPORT' ? '#e0f2fe' : '#ffffff',
                color: activeApp === 'IT_SUPPORT' ? '#0284c7' : '#475569'
              }}
            >
              💻 IT Support
            </button>
            <button
              onClick={() => {
                onSwitchApp('HRMS');
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: activeApp === 'HRMS' ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                background: activeApp === 'HRMS' ? '#faf5ff' : '#ffffff',
                color: activeApp === 'HRMS' ? '#8b5cf6' : '#475569'
              }}
            >
              👥 HRMS
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', padding: '6px 12px', letterSpacing: '0.04em' }}>
            {activeApp === 'IT_SUPPORT' ? 'IT Helpdesk Modules' : 'HRMS Modules'}
          </div>

          {activeApp === 'IT_SUPPORT' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => handleSelect(portalMode === 'EMPLOYEE' ? 'emp-dashboard' : 'dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: (currentTab === 'dashboard' || currentTab === 'emp-dashboard') ? '#e0f2fe' : 'transparent',
                  color: (currentTab === 'dashboard' || currentTab === 'emp-dashboard') ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <LayoutGrid size={18} />
                <span>Dashboard Overview</span>
              </button>

              <button
                onClick={() => handleSelect('chat')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: currentTab === 'chat' ? '#e0f2fe' : 'transparent',
                  color: currentTab === 'chat' ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <MessageCircle size={18} />
                <span>Team Chat & Calls</span>
              </button>

              <button
                onClick={() => handleSelect('biometric')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: currentTab === 'biometric' ? '#e0f2fe' : 'transparent',
                  color: currentTab === 'biometric' ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <Fingerprint size={18} />
                <span>ESP32 Biometric</span>
              </button>

              <button
                onClick={() => handleSelect(portalMode === 'EMPLOYEE' ? 'emp-tickets' : 'tickets')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: currentTab.includes('tickets') ? '#e0f2fe' : 'transparent',
                  color: currentTab.includes('tickets') ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <CheckSquare size={18} />
                <span>Task Board & Tickets</span>
              </button>

              <button
                onClick={() => handleSelect('raise-ticket')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: currentTab === 'raise-ticket' ? '#e0f2fe' : 'transparent',
                  color: currentTab === 'raise-ticket' ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <PlusCircle size={18} />
                <span>Raise New Ticket</span>
              </button>

              <button
                onClick={() => handleSelect(portalMode === 'EMPLOYEE' ? 'emp-profile' : 'devices')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: (currentTab === 'devices' || currentTab === 'emp-profile') ? '#e0f2fe' : 'transparent',
                  color: (currentTab === 'devices' || currentTab === 'emp-profile') ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <HardDrive size={18} />
                <span>Systems Fleet Telemetry</span>
              </button>

              {portalMode !== 'EMPLOYEE' && (
                <>
                  <button
                    onClick={() => handleSelect('employees')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: currentTab === 'employees' ? '#e0f2fe' : 'transparent',
                      color: currentTab === 'employees' ? '#0284c7' : '#334155',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      textAlign: 'left'
                    }}
                  >
                    <Users size={18} />
                    <span>Team Directory</span>
                  </button>

                  <button
                    onClick={() => handleSelect('departments')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: currentTab === 'departments' ? '#e0f2fe' : 'transparent',
                      color: currentTab === 'departments' ? '#0284c7' : '#334155',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      textAlign: 'left'
                    }}
                  >
                    <Building2 size={18} />
                    <span>Departments</span>
                  </button>

                  <button
                    onClick={() => handleSelect('audit')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: currentTab === 'audit' ? '#e0f2fe' : 'transparent',
                      color: currentTab === 'audit' ? '#0284c7' : '#334155',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      textAlign: 'left'
                    }}
                  >
                    <FileText size={18} />
                    <span>Audit Logs</span>
                  </button>

                  <button
                    onClick={() => handleSelect('reports')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: currentTab === 'reports' ? '#e0f2fe' : 'transparent',
                      color: currentTab === 'reports' ? '#0284c7' : '#334155',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      textAlign: 'left'
                    }}
                  >
                    <BarChart3 size={18} />
                    <span>Analytics & Reports</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => handleSelect('hrms-dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: currentTab === 'hrms-dashboard' ? '#faf5ff' : 'transparent',
                  color: currentTab === 'hrms-dashboard' ? '#8b5cf6' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <Clock size={18} />
                <span>{portalMode === 'EMPLOYEE' ? 'Today & Punch In/Out' : 'HR Management Portal'}</span>
              </button>

              <button
                onClick={() => handleSelect('chat')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: currentTab === 'chat' ? '#faf5ff' : 'transparent',
                  color: currentTab === 'chat' ? '#8b5cf6' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <MessageCircle size={18} />
                <span>Team Chat & Calls</span>
              </button>

              <button
                onClick={() => handleSelect('biometric')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: currentTab === 'biometric' ? '#faf5ff' : 'transparent',
                  color: currentTab === 'biometric' ? '#8b5cf6' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <Fingerprint size={18} />
                <span>ESP32 Biometric</span>
              </button>

              <button
                onClick={() => handleSelect(portalMode === 'EMPLOYEE' ? 'hrms-my-attendance' : 'hrms-attendance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: currentTab.includes('attendance') ? '#faf5ff' : 'transparent',
                  color: currentTab.includes('attendance') ? '#8b5cf6' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <CheckSquare size={18} />
                <span>{portalMode === 'EMPLOYEE' ? 'My Attendance Record' : 'Workforce Live Roster'}</span>
              </button>

              <button
                onClick={() => handleSelect('hrms-leaves')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: currentTab === 'hrms-leaves' ? '#faf5ff' : 'transparent',
                  color: currentTab === 'hrms-leaves' ? '#8b5cf6' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <Calendar size={18} />
                <span>{portalMode === 'EMPLOYEE' ? 'Leave Entitlements' : 'Leave Requests Review'}</span>
              </button>

              <button
                onClick={() => handleSelect('hrms-feedback')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: currentTab === 'hrms-feedback' ? '#faf5ff' : 'transparent',
                  color: currentTab === 'hrms-feedback' ? '#8b5cf6' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <MessageSquareWarning size={18} />
                <span>{portalMode === 'EMPLOYEE' ? 'Report Grievance / Feedback' : 'Team Feedback & Grievances'}</span>
              </button>

              <button
                onClick={() => handleSelect('hrms-holidays')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: currentTab === 'hrms-holidays' ? '#faf5ff' : 'transparent',
                  color: currentTab === 'hrms-holidays' ? '#8b5cf6' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left'
                }}
              >
                <Calendar size={18} />
                <span>Company Holidays</span>
              </button>

              {portalMode !== 'EMPLOYEE' && (
                <button
                  onClick={() => handleSelect('hrms-schedules')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: currentTab === 'hrms-schedules' ? '#faf5ff' : 'transparent',
                    color: currentTab === 'hrms-schedules' ? '#8b5cf6' : '#334155',
                    fontWeight: 600,
                    fontSize: '0.86rem',
                    textAlign: 'left'
                  }}
                >
                  <Clock size={18} />
                  <span>Work Schedules & Grace</span>
                </button>
              )}
            </div>
          )}

          {/* Quick Actions & Utilities */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => {
                onOpenNotifications();
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                color: '#334155',
                fontSize: '0.86rem',
                fontWeight: 600
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Bell size={18} color="#0284c7" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span style={{ background: '#ef4444', color: '#ffffff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '10px' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {canSwitchPortal && (
              <button
                onClick={() => {
                  onTogglePortal();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: '#334155',
                  fontSize: '0.86rem',
                  fontWeight: 600
                }}
              >
                <Repeat size={18} color="#f59e0b" />
                <span>Switch to {portalMode === 'ENGINEER' ? 'Employee View' : 'Admin View'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Logout */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))'
        }}>
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '8px',
              background: '#fef2f2',
              color: '#ef4444',
              border: '1px solid #fee2e2',
              fontWeight: 700,
              fontSize: '0.86rem'
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
