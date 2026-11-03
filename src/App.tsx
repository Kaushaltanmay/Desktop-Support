import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EngineerDashboard } from './components/EngineerDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { TicketManagementView } from './components/TicketManagementView';
import { TicketDetailModal } from './components/TicketDetailModal';
import { RaiseTicketPage } from './components/RaiseTicketPage';
import { DevicesView } from './components/DevicesView';
import { EmployeesView } from './components/EmployeesView';
import { DepartmentsView } from './components/DepartmentsView';
import { AuditLogsView } from './components/AuditLogsView';
import { ReportsView } from './components/ReportsView';
import { UserProfileView } from './components/UserProfileView';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { LoginModal } from './components/LoginModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileDrawer } from './components/MobileDrawer';
import { ServerSettingsModal } from './components/ServerSettingsModal';

// HRMS Components
import { EmployeePunchCard } from './components/hrms/EmployeePunchCard';
import { EmployeeAttendanceView } from './components/hrms/EmployeeAttendanceView';
import { LeaveManagementView } from './components/hrms/LeaveManagementView';
import { HRDashboardView } from './components/hrms/HRDashboardView';
import { HRAttendanceManagementView } from './components/hrms/HRAttendanceManagementView';
import { HRLeaveRequestsView } from './components/hrms/HRLeaveRequestsView';
import { HolidaysView } from './components/hrms/HolidaysView';
import { SchedulesView } from './components/hrms/SchedulesView';
import { TeamFeedbackView } from './components/hrms/TeamFeedbackView';
import { TeamChatView } from './components/chat/TeamChatView';

import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('desktop_support_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('desktop_support_token');
  });

  // Active Unified Application: IT Support vs HRMS Portal
  const [activeApp, setActiveApp] = useState<'IT_SUPPORT' | 'HRMS'>(() => {
    try {
      const savedUser = localStorage.getItem('desktop_support_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.role === 'HR') return 'HRMS';
      }
    } catch {}
    return 'IT_SUPPORT';
  });

  // Portal Mode: IT Engineer vs Employee Self-Service Desk vs HR Staff
  const [portalMode, setPortalMode] = useState<'ENGINEER' | 'EMPLOYEE' | 'HR'>(() => {
    try {
      const saved = localStorage.getItem('desktop_support_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === 'HR') return 'HR';
        if (u.role === 'EMPLOYEE') return 'EMPLOYEE';
        return 'ENGINEER';
      }
    } catch {}
    return 'ENGINEER';
  });

  // Active Tab
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (activeApp === 'HRMS') {
      return 'hrms-dashboard';
    }
    return portalMode === 'EMPLOYEE' ? 'emp-dashboard' : 'dashboard';
  });

  // Shared IT Support Data States
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  // HRMS Data States
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  // Modals & UI States
  const [selectedTicketId, setSelectedTicketId] = useState<string | number | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters for Ticket Management
  const [ticketFilters, setTicketFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    department: 'all',
    engineer: 'all',
    sortBy: 'newest'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // Fetch all primary operational telemetry (both IT and HRMS)
  const refreshAllData = useCallback(async () => {
    if (!token) return;

    try {
      const [statsRes, ticketsRes, devicesRes, usersRes, auditRes, notifsRes, todayAttRes] = await Promise.all([
        api.dashboard.getStats().catch(() => null),
        api.tickets.getAll().catch(() => ({ tickets: [] })),
        api.devices.getAll().catch(() => ({ devices: [] })),
        api.users.getAll().catch(() => ({ users: [], departments: [] })),
        api.audit.getLogs().catch(() => ({ auditLogs: [] })),
        api.notifications.getAll().catch(() => ({ notifications: [], unreadCount: 0 })),
        api.attendance.getToday().catch(() => null),
      ]);

      if (statsRes) setStats(statsRes);
      if (ticketsRes?.tickets) setTickets(ticketsRes.tickets);
      if (devicesRes?.devices) setDevices(devicesRes.devices);
      if (usersRes?.users) setUsers(usersRes.users);
      if (usersRes?.departments) setDepartments(usersRes.departments);
      if (auditRes?.auditLogs) setAuditLogs(auditRes.auditLogs);
      if (notifsRes?.notifications) {
        setNotifications(notifsRes.notifications);
        setUnreadNotificationsCount(notifsRes.unreadCount || 0);
      }
      if (todayAttRes) setTodayAttendance(todayAttRes);
    } catch (err) {
      console.error('Failed to refresh platform telemetry:', err);
    }
  }, [token]);

  // Initial load and periodic heartbeat for live notifications & telemetry
  useEffect(() => {
    if (token) {
      refreshAllData();
      const interval = setInterval(() => {
        api.notifications.getAll().then(res => {
          if (res?.notifications) {
            setNotifications(res.notifications);
            setUnreadNotificationsCount(res.unreadCount || 0);
          }
        }).catch(() => {});
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [token, refreshAllData]);

  // Handle Login
  const handleLoginSuccess = (user: any, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);

    let nextApp: 'IT_SUPPORT' | 'HRMS' = 'IT_SUPPORT';
    let nextMode: 'ENGINEER' | 'EMPLOYEE' | 'HR' = 'ENGINEER';

    if (user.role === 'HR') {
      nextApp = 'HRMS';
      nextMode = 'HR';
    } else if (user.role === 'EMPLOYEE') {
      nextApp = 'IT_SUPPORT';
      nextMode = 'EMPLOYEE';
    }

    setActiveApp(nextApp);
    setPortalMode(nextMode);
    setCurrentTab(nextApp === 'HRMS' ? 'hrms-dashboard' : (nextMode === 'ENGINEER' ? 'dashboard' : 'emp-dashboard'));
    showToast(`Welcome back, ${user.name}!`);
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {}
    localStorage.removeItem('desktop_support_token');
    localStorage.removeItem('desktop_support_user');
    setCurrentUser(null);
    setToken(null);
    showToast('Signed out successfully.', 'info');
  };

  // Safety RBAC Guard: Ensure IT Engineer is strictly locked to Employee self-service in HRMS
  useEffect(() => {
    if (activeApp === 'HRMS' && currentUser?.role === 'IT_ENGINEER' && portalMode !== 'EMPLOYEE') {
      setPortalMode('EMPLOYEE');
      setCurrentTab('hrms-dashboard');
    }
  }, [activeApp, currentUser, portalMode]);

  // Virtual Keyboard & Form Focus Auto-Scroll (Responsive Input Tracking)
  useEffect(() => {
    // 1. Web & Mobile Focusin listener (Ensures focused input rolls into center view above keyboard)
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        document.body.classList.add('keyboard-visible');
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }, 280);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' && active.tagName !== 'SELECT')) {
          document.body.classList.remove('keyboard-visible');
        }
      }, 150);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    // 2. Capacitor Native Keyboard Plugin listeners (for Android app)
    let removeShow: any = null;
    let removeDidShow: any = null;
    let removeHide: any = null;

    import('@capacitor/keyboard').then(({ Keyboard }) => {
      Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-visible');
        const active = document.activeElement as HTMLElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
          setTimeout(() => {
            active.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }, 100);
        }
      }).then(handle => { removeShow = handle; }).catch(() => {});

      Keyboard.addListener('keyboardDidShow', () => {
        const active = document.activeElement as HTMLElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
          active.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }).then(handle => { removeDidShow = handle; }).catch(() => {});

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-visible');
      }).then(handle => { removeHide = handle; }).catch(() => {});
    }).catch(() => {});

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      if (removeShow?.remove) removeShow.remove();
      if (removeDidShow?.remove) removeDidShow.remove();
      if (removeHide?.remove) removeHide.remove();
    };
  }, []);

  // Switch between Application Suites (IT Support <-> HRMS)
  const handleSwitchApp = (app: 'IT_SUPPORT' | 'HRMS') => {
    setActiveApp(app);
    if (app === 'HRMS') {
      setCurrentTab('hrms-dashboard');
      // STRICT RBAC: Only HR and Admin get HR management mode; IT Engineers and staff are locked to Employee mode!
      if (currentUser?.role === 'HR' || currentUser?.role === 'ADMIN') {
        setPortalMode('HR');
      } else {
        setPortalMode('EMPLOYEE');
      }
    } else {
      // In IT Support: IT Engineers and Admins get IT Ops mode; others get Employee ticket desk
      if (currentUser?.role === 'IT_ENGINEER' || currentUser?.role === 'ADMIN') {
        setPortalMode('ENGINEER');
        setCurrentTab('dashboard');
      } else {
        setPortalMode('EMPLOYEE');
        setCurrentTab('emp-dashboard');
      }
    }
    showToast(`Switched to ${app === 'HRMS' ? 'HRMS & Attendance Portal' : 'Desktop IT Support Desk'}.`, 'info');
  };

  // Switch between Staff view and Employee view:
  // In IT Support: ONLY IT_ENGINEER or ADMIN can toggle views.
  // In HRMS: ONLY HR or ADMIN can toggle views. An IT_ENGINEER in HRMS is strictly locked to Employee mode!
  const canSwitchPortal = activeApp === 'IT_SUPPORT'
    ? (currentUser?.role === 'IT_ENGINEER' || currentUser?.role === 'ADMIN')
    : (currentUser?.role === 'HR' || currentUser?.role === 'ADMIN');

  const handleTogglePortal = () => {
    if (!canSwitchPortal) return;

    if (activeApp === 'HRMS') {
      if (currentUser?.role !== 'HR' && currentUser?.role !== 'ADMIN') return;
      const nextMode = portalMode === 'HR' ? 'EMPLOYEE' : 'HR';
      setPortalMode(nextMode);
      setCurrentTab('hrms-dashboard');
      showToast(`Switched view to ${nextMode === 'HR' ? 'HR Management' : 'Employee self-service'} mode.`, 'info');
    } else {
      if (currentUser?.role !== 'IT_ENGINEER' && currentUser?.role !== 'ADMIN') return;
      const nextMode = portalMode === 'ENGINEER' ? 'EMPLOYEE' : 'ENGINEER';
      setPortalMode(nextMode);
      setCurrentTab(nextMode === 'ENGINEER' ? 'dashboard' : 'emp-dashboard');
      showToast(`Switched view to ${nextMode === 'ENGINEER' ? 'IT Ops' : 'Employee self-service'} mode.`, 'info');
    }
  };

  // Quick Action Handlers
  const handleQuickAssign = async (ticketId: string | number) => {
    if (!currentUser) return;
    try {
      await api.tickets.assign(ticketId, currentUser.id);
      showToast(`Ticket #${ticketId} assigned to you.`);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign ticket.', 'error');
    }
  };

  const handleQuickResolve = (ticketId: string | number) => {
    setSelectedTicketId(ticketId);
  };

  // Filtered tickets based on active portal mode & user
  const displayTickets = portalMode === 'EMPLOYEE'
    ? tickets.filter(t => t.created_by === currentUser?.id)
    : tickets;

  const userDevice = devices.find(d => d.employee_id === currentUser?.id);
  const userTickets = tickets.filter(t => t.created_by === currentUser?.id);
  const activeTicketCount = displayTickets.filter(t => ['OPEN', 'IN PROGRESS', 'WAITING FOR USER'].includes(t.status)).length;
  const engineersList = users.filter(u => u.role === 'IT_ENGINEER' || u.role === 'ADMIN');

  // If user is not logged in, show LoginModal
  if (!currentUser || !token) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc' }}>
      
      {/* Toast Alert Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#0284c7' : '#059669',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 2000,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          fontSize: '0.85rem',
          fontWeight: 600,
          animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : toast.type === 'info' ? <Info size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'notifications') {
            setIsNotificationsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        portalMode={portalMode}
        onTogglePortal={handleTogglePortal}
        canSwitchPortal={canSwitchPortal}
        ticketCount={activeTicketCount}
        activeApp={activeApp}
      />

      {/* Main Right Viewport */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: currentTab === 'chat' ? 'hidden' : 'auto'
      }}>
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          unreadCount={unreadNotificationsCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          portalMode={portalMode}
          onTogglePortal={handleTogglePortal}
          canSwitchPortal={canSwitchPortal}
          activeApp={activeApp}
          onSwitchApp={handleSwitchApp}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          onOpenServerSettings={() => setIsServerSettingsOpen(true)}
          onNavigateToChat={() => setCurrentTab('chat')}
        />

        {/* Dynamic Content Canvas */}
        <main
          className="app-main-content"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            padding: currentTab === 'chat' ? '12px 18px 14px 18px' : '24px 28px',
            overflow: currentTab === 'chat' ? 'hidden' : 'visible'
          }}
        >
          
          {/* Universal Team Chat & Media Collaboration (WhatsApp style with Live Calls & Screen Sharing) */}
          {currentTab === 'chat' && (
            <TeamChatView
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {currentTab !== 'chat' && (
            <>
              {/* ============================================================== */}
              {/* APPLICATION SUITE 1: DESKTOP IT SUPPORT                       */}
              {/* ============================================================== */}
              {activeApp === 'IT_SUPPORT' && (
            <>
              {/* IT Engineer & Admin Views: Strictly accessible only by users with IT_ENGINEER or ADMIN role */}
              {((portalMode === 'ENGINEER') && (currentUser?.role === 'IT_ENGINEER' || currentUser?.role === 'ADMIN')) && (
                <>
                  {currentTab === 'dashboard' && (
                    <EngineerDashboard
                      stats={stats}
                      onOpenTicket={(id) => setSelectedTicketId(id)}
                      onQuickResolve={handleQuickResolve}
                      onQuickAssign={handleQuickAssign}
                    />
                  )}

                  {currentTab === 'tickets' && (
                    <TicketManagementView
                      tickets={tickets}
                      onOpenTicket={(id) => setSelectedTicketId(id)}
                      onOpenRaiseModal={() => setCurrentTab('raise-ticket')}
                      departments={departments}
                      engineers={engineersList}
                      filters={ticketFilters}
                      setFilters={setTicketFilters}
                    />
                  )}

                  {currentTab === 'employees' && (
                    <EmployeesView
                      users={users}
                      departments={departments}
                      currentUser={currentUser}
                      onRefresh={refreshAllData}
                    />
                  )}

                  {currentTab === 'departments' && (
                    <DepartmentsView
                      departments={departments}
                      users={users}
                      devices={devices}
                      tickets={tickets}
                    />
                  )}

                  {currentTab === 'devices' && (
                    <DevicesView
                      devices={devices}
                      users={users}
                      departments={departments}
                      currentUser={currentUser}
                      onRefresh={refreshAllData}
                    />
                  )}

                  {currentTab === 'raise-ticket' && (
                    <RaiseTicketPage
                      currentUser={currentUser}
                      userDevice={userDevice}
                      onTicketCreated={(ticket) => {
                        showToast(`Ticket ${ticket.ticket_number || 'created'} logged successfully!`);
                        refreshAllData();
                        setCurrentTab('tickets');
                      }}
                      onCancel={() => setCurrentTab('dashboard')}
                    />
                  )}

                  {currentTab === 'audit' && (
                    <AuditLogsView auditLogs={auditLogs} />
                  )}

                  {currentTab === 'reports' && (
                    <ReportsView />
                  )}
                </>
              )}

              {/* Employee IT Views */}
              {portalMode === 'EMPLOYEE' && (
                <>
                  {currentTab === 'emp-dashboard' && (
                    <EmployeeDashboard
                      stats={stats}
                      currentUser={currentUser}
                      onOpenRaiseTicket={() => setCurrentTab('raise-ticket')}
                      onOpenTicket={(id) => setSelectedTicketId(id)}
                      onViewAllTickets={() => setCurrentTab('emp-tickets')}
                    />
                  )}

                  {currentTab === 'emp-tickets' && (
                    <TicketManagementView
                      tickets={displayTickets}
                      onOpenTicket={(id) => setSelectedTicketId(id)}
                      onOpenRaiseModal={() => setCurrentTab('raise-ticket')}
                      departments={departments}
                      engineers={engineersList}
                      filters={ticketFilters}
                      setFilters={setTicketFilters}
                    />
                  )}

                  {currentTab === 'raise-ticket' && (
                    <RaiseTicketPage
                      currentUser={currentUser}
                      userDevice={userDevice}
                      onTicketCreated={(ticket) => {
                        showToast(`Ticket ${ticket.ticket_number || 'created'} raised successfully!`);
                        refreshAllData();
                        setCurrentTab('emp-tickets');
                      }}
                      onCancel={() => setCurrentTab('emp-dashboard')}
                    />
                  )}

                  {currentTab === 'emp-profile' && (
                    <UserProfileView
                      currentUser={currentUser}
                      userDevice={userDevice}
                      departments={departments}
                      userTickets={userTickets}
                      onOpenTicket={(id) => setSelectedTicketId(id)}
                      onOpenRaiseTicket={() => setCurrentTab('raise-ticket')}
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* APPLICATION SUITE 2: HUMAN RESOURCE MANAGEMENT (HRMS)          */}
          {/* ============================================================== */}
          {activeApp === 'HRMS' && (
            <>
              {/* HR / Admin Views: Strictly accessible only by users with HR or ADMIN role */}
              {((portalMode === 'HR') && (currentUser?.role === 'HR' || currentUser?.role === 'ADMIN')) && (
                <>
                  {currentTab === 'hrms-dashboard' && (
                    <HRDashboardView
                      onNavigateToLeaves={() => setCurrentTab('hrms-leaves')}
                      onNavigateToAttendance={() => setCurrentTab('hrms-attendance')}
                    />
                  )}

                  {currentTab === 'hrms-attendance' && (
                    <HRAttendanceManagementView
                      departments={departments}
                      showToast={showToast}
                    />
                  )}

                  {currentTab === 'hrms-leaves' && (
                    <HRLeaveRequestsView showToast={showToast} />
                  )}

                  {currentTab === 'employees' && (
                    <EmployeesView
                      users={users}
                      departments={departments}
                      currentUser={currentUser}
                      onRefresh={refreshAllData}
                    />
                  )}

                  {currentTab === 'departments' && (
                    <DepartmentsView
                      departments={departments}
                      users={users}
                      devices={devices}
                      tickets={tickets}
                    />
                  )}

                  {currentTab === 'hrms-schedules' && (
                    <SchedulesView />
                  )}

                  {currentTab === 'hrms-holidays' && (
                    <HolidaysView currentUser={currentUser} showToast={showToast} />
                  )}

                  {currentTab === 'hrms-feedback' && (
                    <TeamFeedbackView
                      currentUser={currentUser}
                      users={users}
                      showToast={showToast}
                    />
                  )}

                  {currentTab === 'audit' && (
                    <AuditLogsView auditLogs={auditLogs} />
                  )}

                  {currentTab === 'reports' && (
                    <ReportsView />
                  )}
                </>
              )}

              {/* Employee HRMS Views (Punch In/Out, My Attendance, Leaves) */}
              {portalMode === 'EMPLOYEE' && (
                <>
                  {currentTab === 'hrms-dashboard' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                      <EmployeePunchCard
                        todayData={todayAttendance}
                        onAttendanceUpdated={refreshAllData}
                        showToast={showToast}
                      />
                      <EmployeeAttendanceView />
                    </div>
                  )}

                  {currentTab === 'hrms-my-attendance' && (
                    <EmployeeAttendanceView />
                  )}

                  {currentTab === 'hrms-leaves' && (
                    <LeaveManagementView showToast={showToast} />
                  )}

                  {currentTab === 'hrms-holidays' && (
                    <HolidaysView currentUser={currentUser} showToast={showToast} />
                  )}

                  {currentTab === 'hrms-feedback' && (
                    <TeamFeedbackView
                      currentUser={currentUser}
                      users={users}
                      showToast={showToast}
                    />
                  )}

                  {currentTab === 'emp-profile' && (
                    <UserProfileView
                      currentUser={currentUser}
                      userDevice={userDevice}
                      departments={departments}
                      userTickets={userTickets}
                      onOpenTicket={(id) => setSelectedTicketId(id)}
                      onOpenRaiseTicket={() => {
                        setActiveApp('IT_SUPPORT');
                        setCurrentTab('raise-ticket');
                      }}
                    />
                  )}
                </>
              )}
              {/* end activeApp HRMS */}
            </>
          )}
          {/* end currentTab !== 'chat' */}
          </>
          )}
        </main>
      </div>

      {/* Ticket Details Modal & Timeline */}
      {selectedTicketId !== null && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          currentUser={currentUser}
          engineers={engineersList}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={() => {
            refreshAllData();
            showToast('Ticket updated successfully.');
          }}
        />
      )}

      {/* In-App Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={async (id) => {
          await api.notifications.markRead(id);
          refreshAllData();
        }}
        onMarkAllRead={async () => {
          await api.notifications.markAllRead();
          refreshAllData();
          showToast('All notifications marked as read.');
        }}
        onSelectTicket={(ticketId) => {
          setIsNotificationsOpen(false);
          setSelectedTicketId(ticketId);
        }}
      />

      {/* Mobile Bottom Navigation Bar (Phone Screen / Touch Navigation) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'notifications') {
            setIsNotificationsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        activeApp={activeApp}
        portalMode={portalMode}
        ticketCount={activeTicketCount}
      />

      {/* Mobile Sliding Drawer Menu */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'notifications') {
            setIsNotificationsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeApp={activeApp}
        onSwitchApp={handleSwitchApp}
        portalMode={portalMode}
        onTogglePortal={handleTogglePortal}
        canSwitchPortal={canSwitchPortal}
        onOpenServerSettings={() => setIsServerSettingsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={unreadNotificationsCount}
      />

      {/* Mobile & Network API Server Connection Settings Modal */}
      <ServerSettingsModal
        isOpen={isServerSettingsOpen}
        onClose={() => setIsServerSettingsOpen(false)}
        onServerChanged={() => {
          refreshAllData();
          showToast('Server connection updated.');
        }}
      />
    </div>
  );
}

export default App;
