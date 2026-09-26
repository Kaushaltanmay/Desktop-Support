import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Check, 
  Wrench,
  Radio
} from 'lucide-react';

interface EngineerDashboardProps {
  stats: any;
  onOpenTicket: (ticketId: string | number) => void;
  onQuickResolve: (ticketId: string | number) => void;
  onQuickAssign: (ticketId: string | number) => void;
}

export const EngineerDashboard: React.FC<EngineerDashboardProps> = ({
  stats,
  onOpenTicket,
  onQuickResolve,
  onQuickAssign
}) => {
  const [fastAlertMode, setFastAlertMode] = useState(false);

  const ramBars = [
    { label: '16 GB DDR3', count: 14, color: '#06b6d4' },
    { label: '', count: 6, color: '#8b5cf6' },
    { label: '12 GB DDR3', count: 5, color: '#10b981' },
    { label: '', count: 4, color: '#f97316' },
    { label: '24 GB DDR4', count: 3, color: '#ef4444' },
    { label: '', count: 2, color: '#3b82f6' },
    { label: '10 GB DDR3', count: 2, color: '#06b6d4' },
    { label: '', count: 1, color: '#8b5cf6' },
    { label: '4 GB DDR3', count: 1, color: '#10b981' }
  ];

  const totalTickets = (stats?.stats?.totalTickets || 4);
  const resolvedCount = (stats?.stats?.resolvedTickets || 2);
  const resolvedPercent = Math.round((resolvedCount / Math.max(1, totalTickets)) * 100);

  const activeTickets = stats?.activeComplaintsQueue || [];
  const recentlyResolved = stats?.recentlyResolved || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      
      {/* 1. Fast Alert Test Mode Banner (Matching screenshot) */}
      <div style={{
        background: '#faf5ff',
        border: '1px solid #ddd6fe',
        borderRadius: '16px',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#6b21a8', letterSpacing: '-0.01em' }}>
            Fast Alert Test Mode
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#6b21a8', opacity: 0.85, marginTop: '2px' }}>
            Shorten warning beep interval from 15 mins to 30 seconds for quick testing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b21a8' }}>
            {fastAlertMode ? '30 seconds (Active)' : '15 minutes'}
          </span>
          <button
            onClick={() => setFastAlertMode(!fastAlertMode)}
            style={{
              width: '42px',
              height: '24px',
              borderRadius: '24px',
              backgroundColor: fastAlertMode ? '#6b21a8' : '#0f172a',
              position: 'relative',
              cursor: 'pointer',
              padding: '2px',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              transform: fastAlertMode ? 'translateX(18px)' : 'translateX(0)',
              transition: 'transform 0.2s'
            }} />
          </button>
        </div>
      </div>

      {/* 2. Top 4 Stat Cards (Matching screenshot left border stripes) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '18px'
      }}>
        {/* Total Systems */}
        <div className="stat-card blue">
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            TOTAL SYSTEMS
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginTop: '6px' }}>
            {stats?.stats?.totalSystems ?? 38}
          </div>
        </div>

        {/* Active Assignments */}
        <div className="stat-card purple">
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            ACTIVE ASSIGNMENTS
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginTop: '6px' }}>
            {stats?.stats?.activeAssignments ?? 25}
          </div>
        </div>

        {/* Pending Complaints */}
        <div className="stat-card orange">
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            PENDING COMPLAINTS
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginTop: '6px' }}>
            {stats?.stats?.pendingComplaints ?? 0}
          </div>
        </div>

        {/* Avg Resolve Time */}
        <div className="stat-card green">
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            AVG RESOLVE TIME
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginTop: '6px' }}>
            {stats?.stats?.avgResolveTimeFormatted || '28m 27s'}
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Hardware Distribution & Ticket Status Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '20px'
      }}>
        {/* Hardware Distribution (RAM) Horizontal Bar Chart */}
        <div className="app-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Hardware Distribution (RAM)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ramBars.map((bar, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '70px', fontSize: '0.72rem', color: '#475569', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {bar.label}
                </span>
                <div style={{ flex: 1, height: '16px', background: '#f8fafc', borderRadius: '3px', position: 'relative' }}>
                  <div style={{
                    width: `${(bar.count / 16) * 100}%`,
                    height: '100%',
                    backgroundColor: bar.color,
                    borderRadius: '2px',
                    transition: 'width 0.5s ease-out'
                  }} />
                </div>
              </div>
            ))}

            {/* X-axis scale numbers matching screenshot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '82px', fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
              <span>0</span>
              <span>4</span>
              <span>8</span>
              <span>12</span>
              <span>16</span>
            </div>
          </div>
        </div>

        {/* Ticket Status Breakdown Donut Chart */}
        <div className="app-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Ticket Status Breakdown
            </h3>
          </div>

          {/* SVG Doughnut Ring Chart */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', position: 'relative' }}>
            <svg width="190" height="190" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="14"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="14"
                strokeDasharray={`${resolvedPercent * 2.38} 238`}
                strokeDashoffset="60"
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                {resolvedPercent}%
              </span>
              <p style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Resolved</p>
            </div>
          </div>

          {/* Legend matching screenshot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '0.8rem', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px' }} />
              <span style={{ fontWeight: 600 }}>Resolved</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#0284c7', borderRadius: '2px' }} />
              <span>In Progress / Open</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Active Complaints Queue & Recently Resolved */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '20px'
      }}>
        {/* Active Complaints Queue */}
        <div className="app-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Active Complaints Queue
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              Sorted by Severity
            </span>
          </div>

          {activeTickets.length === 0 ? (
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1
            }}>
              <span style={{ fontSize: '1.8rem', marginBottom: '8px' }}>✨</span>
              <p style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 500 }}>
                No active complaints. System functioning normally!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeTickets.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => onOpenTicket(t.id)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={
                        t.priority === 'CRITICAL' ? 'priority-critical' :
                        t.priority === 'HIGH' ? 'priority-high' :
                        t.priority === 'MEDIUM' ? 'priority-medium' : 'priority-low'
                      }>
                        {t.priority}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                        {t.asset_tag ? `${t.asset_tag} — ` : ''}{t.creator_name}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      #{t.ticket_number}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                    <span style={{ color: '#64748b', fontWeight: 400 }}>Issue: </span>{t.subject}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Assigned: <strong style={{ color: '#0f172a' }}>{t.assignee_name || 'Unassigned'}</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                      {!t.assigned_to && (
                        <button
                          onClick={() => onQuickAssign(t.id)}
                          style={{
                            background: '#e0f2fe',
                            color: '#0284c7',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}
                        >
                          Claim Ticket
                        </button>
                      )}
                      <button
                        onClick={() => onQuickResolve(t.id)}
                        style={{
                          background: '#ecfdf5',
                          color: '#059669',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600
                        }}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Resolved (Matching screenshot 2 right card) */}
        <div className="app-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Recently Resolved
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentlyResolved.map((t: any) => (
              <div
                key={t.id}
                onClick={() => onOpenTicket(t.id)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Badges & Machine Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge-resolved">
                    <Check size={11} strokeWidth={3} /> RESOLVED
                  </span>
                  <span className={
                    t.priority === 'CRITICAL' ? 'priority-critical' :
                    t.priority === 'HIGH' ? 'priority-high' :
                    t.priority === 'MEDIUM' ? 'priority-medium' : 'priority-low'
                  }>
                    {t.priority}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                    {t.asset_tag ? `${t.asset_tag} — ` : ''}{t.creator_name}
                  </span>
                </div>

                {/* Issue Subject */}
                <p style={{ fontSize: '0.86rem', color: '#0f172a', fontWeight: 600, lineHeight: 1.4 }}>
                  <span style={{ color: '#475569', fontWeight: 500 }}>Issue: </span>
                  {t.subject}
                </p>

                {/* Resolution Notes pill box (Exact match to screenshot) */}
                {t.resolution_notes && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#166534',
                    fontStyle: 'italic'
                  }}>
                    <strong>Resolution Notes:</strong> {t.resolution_notes}
                  </div>
                )}

                {/* Time to resolve & Timestamp footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>
                    Time to Resolve: <strong style={{ color: '#0f172a' }}>{t.resolution_time_formatted || '15m'}</strong>
                  </span>
                  <span>{new Date(t.resolved_at || t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
