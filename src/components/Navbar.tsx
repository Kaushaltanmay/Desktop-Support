import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  TicketCheck, 
  Wrench, 
  Terminal, 
  BookOpen, 
  BarChart3, 
  PlusCircle, 
  Search, 
  Clock
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCreateTicket: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleTerminal: () => void;
  isTerminalOpen: boolean;
  unresolvedCount: number;
  criticalMachineCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openCreateTicket,
  searchQuery,
  setSearchQuery,
  toggleTerminal,
  isTerminalOpen,
  unresolvedCount,
  criticalMachineCount
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'fleet', label: 'Fleet & Hardware', icon: Monitor, badge: criticalMachineCount > 0 ? `${criticalMachineCount} Alert` : null, badgeColor: 'bg-rose-500' },
    { id: 'tickets', label: 'Incidents & Tickets', icon: TicketCheck, badge: unresolvedCount > 0 ? `${unresolvedCount}` : null, badgeColor: 'bg-amber-500' },
    { id: 'toolbox', label: 'Support Runbooks', icon: Wrench },
    { id: 'analytics', label: 'SLA & Telemetry', icon: BarChart3 },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  ];

  return (
    <header className="glass-panel" style={{
      margin: '16px 20px',
      padding: '12px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      position: 'sticky',
      top: '12px',
      zIndex: 40
    }}>
      {/* Top Bar: Brand, Status, Live Clock, Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
          }}>
            <Monitor size={24} color="#080c16" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
                DESKTOP SUPPORT
              </h1>
              <span style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.08em',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                Ops Center v2.4
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Real-time Fleet Telemetry • Endpoint Diagnostics • IT Service Desk
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div style={{ flex: '1', maxWidth: '380px', minWidth: '220px', position: 'relative' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search hostnames, users, tickets, IPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '38px',
              paddingRight: '12px',
              height: '38px',
              borderRadius: '10px',
              fontSize: '0.85rem'
            }}
          />
        </div>

        {/* Status Telemetry & Quick Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Live indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '6px 12px',
            borderRadius: '20px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981'
            }} className="pulse-live"></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', letterSpacing: '0.04em' }}>
              AGENTS ONLINE
            </span>
          </div>

          {/* Clock */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#94a3b8',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-glass)'
          }}>
            <Clock size={14} color="#38bdf8" />
            <span>{time || '12:00:00'}</span>
          </div>

          {/* Quick Terminal Button */}
          <button
            id="toggle-terminal-btn"
            onClick={toggleTerminal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isTerminalOpen ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.6)',
              border: `1px solid ${isTerminalOpen ? '#38bdf8' : 'var(--border-glass)'}`,
              color: isTerminalOpen ? '#38bdf8' : '#e2e8f0',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            <Terminal size={15} />
            <span>CLI Console</span>
          </button>

          {/* Create Incident Button */}
          <button
            id="new-ticket-btn"
            onClick={openCreateTicket}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: '0 2px 12px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            <PlusCircle size={16} />
            <span>New Incident</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar: Tab Navigation */}
      <nav style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '10px', overflowX: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#38bdf8' : '#94a3b8',
                background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(56, 189, 248, 0.3)' : 'transparent'}`,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isActive ? '#38bdf8' : '#94a3b8'} />
              <span>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: item.badgeColor === 'bg-rose-500' ? '#f43f5e' : '#f59e0b',
                  color: '#fff',
                  fontWeight: 700
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
