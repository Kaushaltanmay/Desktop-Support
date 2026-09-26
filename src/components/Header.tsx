import React, { useState } from 'react';
import { 
  Sun, 
  Volume2, 
  VolumeX, 
  Bell, 
  ChevronDown, 
  LogOut, 
  User as UserIcon, 
  Laptop, 
  Shield,
  Users
} from 'lucide-react';

interface HeaderProps {
  currentUser: any;
  onLogout: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  portalMode: 'ENGINEER' | 'EMPLOYEE' | 'HR';
  onTogglePortal: () => void;
  canSwitchPortal: boolean;
  activeApp: 'IT_SUPPORT' | 'HRMS';
  onSwitchApp: (app: 'IT_SUPPORT' | 'HRMS') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  unreadCount,
  onOpenNotifications,
  portalMode,
  onTogglePortal,
  canSwitchPortal,
  activeApp,
  onSwitchApp
}) => {
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const initial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
  const displayName = currentUser?.name ? currentUser.name.toLowerCase().split(' ')[0] : 'user';

  return (
    <header style={{
      height: '68px',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Left: Fly Media Technology Logo & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img
          src="/flymedia_logo.png"
          alt="Fly Media Technology"
          style={{ height: '36px', objectFit: 'contain' }}
        />
        <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
            {activeApp === 'IT_SUPPORT' ? 'Desktop IT Support' : 'HRMS & Attendance Portal'}
          </span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: '6px',
            background: portalMode === 'ENGINEER' ? '#e0f2fe' : portalMode === 'HR' ? '#faf5ff' : '#ecfdf5',
            color: portalMode === 'ENGINEER' ? '#0284c7' : portalMode === 'HR' ? '#8b5cf6' : '#059669',
            border: `1px solid ${portalMode === 'ENGINEER' ? '#bae6fd' : portalMode === 'HR' ? '#ddd6fe' : '#a7f3d0'}`
          }}>
            {portalMode === 'ENGINEER' ? 'IT Ops Portal' : portalMode === 'HR' ? 'HR Staff Desk' : 'Employee Portal'}
          </span>
        </div>
      </div>

      {/* Right Controls: Exactly matching reference UI */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Unified Application Switcher: IT Support <-> HRMS */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => onSwitchApp('IT_SUPPORT')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: activeApp === 'IT_SUPPORT' ? '#ffffff' : 'transparent',
              color: activeApp === 'IT_SUPPORT' ? '#0284c7' : '#64748b',
              boxShadow: activeApp === 'IT_SUPPORT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <Laptop size={14} />
            <span>IT Support</span>
          </button>

          <button
            onClick={() => onSwitchApp('HRMS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: activeApp === 'HRMS' ? '#ffffff' : 'transparent',
              color: activeApp === 'HRMS' ? '#8b5cf6' : '#64748b',
              boxShadow: activeApp === 'HRMS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <Users size={14} />
            <span>HR Portal</span>
          </button>
        </div>

        {/* Portal Switcher (for Admins / Staff testing) */}
        {canSwitchPortal && (
          <button
            onClick={onTogglePortal}
            title="Switch portal view"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#475569'
            }}
          >
            <span>Switch: {portalMode === 'EMPLOYEE' ? (activeApp === 'IT_SUPPORT' ? 'Engineer View' : 'HR View') : 'Employee View'}</span>
          </button>
        )}

        {/* Light Theme Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#475569'
        }}>
          <Sun size={15} color="#eab308" />
          <span>Light</span>
        </div>

        {/* User Pill: 'T tanmay ▼' matching screenshot */}
        <div style={{ position: 'relative' }}>
          <button
            id="user-menu-btn"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              padding: '4px 8px',
              borderRadius: '20px'
            }}
          >
            {/* Purple circle avatar */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 700
            }}>
              {initial}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
              {displayName}
            </span>
            <ChevronDown size={14} color="#64748b" />
          </button>

          {/* User Dropdown */}
          {isUserMenuOpen && (
            <div className="app-card animate-fade-in" style={{
              position: 'absolute',
              right: 0,
              top: '42px',
              width: '220px',
              padding: '12px',
              background: '#ffffff',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{currentUser?.name}</p>
                <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{currentUser?.email}</p>
                <span style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: '#f1f5f9',
                  color: '#475569'
                }}>
                  {currentUser?.role}
                </span>
              </div>

              <button
                onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: '#dc2626',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textAlign: 'left'
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Sound toggle button matching screenshot */}
        <button
          onClick={() => setIsSoundMuted(!isSoundMuted)}
          title={isSoundMuted ? 'Unmute alert chimes' : 'Mute alert chimes'}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {isSoundMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        {/* Notification Bell button with badge matching screenshot */}
        <button
          id="btn-notifications"
          onClick={onOpenNotifications}
          title="Notifications"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <Bell size={17} color="#eab308" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444'
            }} />
          )}
        </button>
      </div>
    </header>
  );
};
