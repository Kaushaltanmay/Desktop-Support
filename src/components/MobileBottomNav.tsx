import React from 'react';
import { 
  LayoutGrid, 
  CheckSquare, 
  PlusCircle, 
  HardDrive, 
  Menu, 
  Calendar, 
  Clock, 
  User, 
  ShieldCheck
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMenu: () => void;
  activeApp: 'IT_SUPPORT' | 'HRMS';
  portalMode: 'ENGINEER' | 'EMPLOYEE' | 'HR';
  ticketCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMenu,
  activeApp,
  portalMode,
  ticketCount = 0
}) => {
  const isItSupport = activeApp === 'IT_SUPPORT';
  const isEmployee = portalMode === 'EMPLOYEE';

  // In Team Chat or Calls view, hide bottom nav to dedicate full screen to message composition
  if (currentTab === 'chat') {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'calc(58px + env(safe-area-inset-bottom, 0px))',
      background: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 90,
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      boxSizing: 'border-box'
    }}>
      {isItSupport ? (
        <>
          {/* Dashboard Tab */}
          <button
            type="button"
            onClick={() => onSelectTab(isEmployee ? 'emp-dashboard' : 'dashboard')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              color: (currentTab === 'dashboard' || currentTab === 'emp-dashboard') ? '#0284c7' : '#64748b'
            }}
          >
            <LayoutGrid size={20} strokeWidth={currentTab.includes('dashboard') ? 2.5 : 1.8} />
            <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>Desk</span>
          </button>

          {/* Tickets Tab */}
          <button
            type="button"
            onClick={() => onSelectTab(isEmployee ? 'emp-tickets' : 'tickets')}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              color: currentTab.includes('tickets') ? '#0284c7' : '#64748b'
            }}
          >
            <CheckSquare size={20} strokeWidth={currentTab.includes('tickets') ? 2.5 : 1.8} />
            {ticketCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '10px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.58rem',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '10px'
              }}>
                {ticketCount}
              </span>
            )}
            <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>Tickets</span>
          </button>

          {/* Quick Raise Ticket Action */}
          <button
            type="button"
            onClick={() => onSelectTab('raise-ticket')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              color: currentTab === 'raise-ticket' ? '#0284c7' : '#0284c7'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 8px rgba(2, 132, 199, 0.35)',
              marginTop: '-14px'
            }}>
              <PlusCircle size={22} color="#ffffff" />
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>Raise</span>
          </button>

          {/* Devices / PC Tab */}
          <button
            type="button"
            onClick={() => onSelectTab(isEmployee ? 'emp-profile' : 'devices')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              color: (currentTab === 'devices' || currentTab === 'emp-profile') ? '#0284c7' : '#64748b'
            }}
          >
            {isEmployee ? (
              <User size={20} strokeWidth={currentTab === 'emp-profile' ? 2.5 : 1.8} />
            ) : (
              <HardDrive size={20} strokeWidth={currentTab === 'devices' ? 2.5 : 1.8} />
            )}
            <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>
              {isEmployee ? 'My PC' : 'Fleet'}
            </span>
          </button>

          {/* Menu Drawer Toggle */}
          <button
            type="button"
            onClick={onOpenMenu}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              color: '#64748b'
            }}
          >
            <Menu size={20} />
            <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>More</span>
          </button>
        </>
      ) : (
        /* HRMS Navigation Mode */
        <>
          {/* Punch / Today */}
          <button
            type="button"
            onClick={() => onSelectTab('hrms-dashboard')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              color: currentTab === 'hrms-dashboard' ? '#8b5cf6' : '#64748b'
            }}
          >
            <Clock size={20} strokeWidth={currentTab === 'hrms-dashboard' ? 2.5 : 1.8} />
            <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>Punch</span>
          </button>

          {/* Attendance Tab */}
          <button
            type="button"
            onClick={() => onSelectTab(isEmployee ? 'hrms-my-attendance' : 'hrms-attendance')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              color: currentTab.includes('attendance') ? '#8b5cf6' : '#64748b'
            }}
          >
            <CheckSquare size={20} strokeWidth={currentTab.includes('attendance') ? 2.5 : 1.8} />
            <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>Roster</span>
          </button>

          {/* Leaves Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('hrms-leaves')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              color: currentTab === 'hrms-leaves' ? '#8b5cf6' : '#64748b'
            }}
          >
            <Calendar size={20} strokeWidth={currentTab === 'hrms-leaves' ? 2.5 : 1.8} />
            <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>Leaves</span>
          </button>

          {/* Holidays */}
          <button
            type="button"
            onClick={() => onSelectTab('hrms-holidays')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              color: currentTab === 'hrms-holidays' ? '#8b5cf6' : '#64748b'
            }}
          >
            <ShieldCheck size={20} strokeWidth={currentTab === 'hrms-holidays' ? 2.5 : 1.8} />
            <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>Holidays</span>
          </button>

          {/* Menu Drawer Toggle */}
          <button
            type="button"
            onClick={onOpenMenu}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              color: '#64748b'
            }}
          >
            <Menu size={20} />
            <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>More</span>
          </button>
        </>
      )}
    </nav>
  );
};
