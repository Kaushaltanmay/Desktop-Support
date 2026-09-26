import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Award, 
  Zap 
} from 'lucide-react';
import type { Ticket } from '../types';

interface AnalyticsViewProps {
  tickets: Ticket[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tickets }) => {
  const resolved = tickets.filter(t => t.status === 'resolved').length;
  const open = tickets.filter(t => t.status === 'open').length;
  const inProgress = tickets.filter(t => t.status === 'in_progress').length;

  const categoryBreakdown = [
    { name: 'Hardware', count: 2, percent: 40, color: '#38bdf8' },
    { name: 'OS & Software', count: 1, percent: 20, color: '#a855f7' },
    { name: 'Access & Security', count: 1, percent: 20, color: '#10b981' },
    { name: 'Network & Connectivity', count: 1, percent: 20, color: '#f59e0b' }
  ];

  const technicians = [
    { name: 'Tanmay Kaushal', role: 'Desktop Support Lead (L2)', resolved: 42, csat: 99.4, badge: 'Fleet Master' },
    { name: 'Jordan Lee', role: 'Support Technician (L1)', resolved: 28, csat: 96.8, badge: 'Fast Responder' },
    { name: 'Priya Sharma', role: 'Systems Admin', resolved: 31, csat: 98.1, badge: 'Network Guru' },
    { name: 'Marcus Vance', role: 'Field Technician', resolved: 19, csat: 95.0, badge: 'Hardware Specialist' }
  ];

  return (
    <div style={{ padding: '0 20px 30px' }} className="animate-fade-in">
      
      {/* KPI Stat Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* SLA Rate */}
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>SLA Compliance</span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>96.4%</span>
            <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>+1.8% this week</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Target threshold: &gt;95.0%
          </div>
        </div>

        {/* MTTA */}
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Avg Acknowledge Time</span>
            <Clock size={18} color="#38bdf8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>3.2 min</span>
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>-45s reduction</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            First Response within SLA
          </div>
        </div>

        {/* MTTR */}
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Avg Resolution Time</span>
            <Zap size={18} color="#f59e0b" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>16.8 min</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>across all tiers</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Hardware swaps & driver fixes
          </div>
        </div>

        {/* User CSAT */}
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Customer Satisfaction (CSAT)</span>
            <Award size={18} color="#a855f7" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#a855f7' }}>98.9%</span>
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>★★★★★</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Based on 148 employee reviews
          </div>
        </div>
      </div>

      {/* Grid: Categories & Technician Leaderboard */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Ticket Category Distribution */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            Incident Category Breakdown
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '20px' }}>
            Distribution of incoming service desk requests over the last 30 days.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categoryBreakdown.map(cat => (
              <div key={cat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{cat.name}</span>
                  <span style={{ color: '#94a3b8' }}>{cat.count} tickets ({cat.percent}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${cat.percent}%`,
                    height: '100%',
                    backgroundColor: cat.color,
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-glass)',
            textAlign: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Open Queue</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>{open}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>In Progress</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24' }}>{inProgress}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Resolved Today</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{resolved}</p>
            </div>
          </div>
        </div>

        {/* Technician Performance Leaderboard */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Desktop Support Leaderboard
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>This Month</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '20px' }}>
            Engineers ranked by resolved incidents, ticket turnaround, and user feedback.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {technicians.map((tech, idx) => (
              <div
                key={tech.name}
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-glass)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: idx === 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: idx === 0 ? '#38bdf8' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{tech.name}</span>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8'
                      }}>
                        {tech.badge}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{tech.role}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>
                    {tech.resolved} Closed
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {tech.csat}% CSAT
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
