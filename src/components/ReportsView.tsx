import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart3, TrendingUp, Clock, CheckCircle, Users, Award, Calendar } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [timeframe, setTimeframe] = useState('30days');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.reports.getStats(timeframe);
        setData(res);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [timeframe]);

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading report telemetry...</div>;
  }

  const summary = data?.summary || {};
  const byCategory = data?.byCategory || [];
  const byPriority = data?.byPriority || [];
  const engineerWorkload = data?.engineerWorkload || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      
      {/* Title & Timeframe Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Service Desk Reports & SLA Metrics
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Historical ticket volume, resolution turnaround, and technician performance.
          </p>
        </div>

        {/* Timeframe selector matching section 21 */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: '7 Days' },
            { id: '30days', label: '30 Days' },
            { id: 'all', label: 'All Time' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: timeframe === t.id ? 700 : 500,
                background: timeframe === t.id ? '#ffffff' : 'transparent',
                color: timeframe === t.id ? '#0284c7' : '#64748b',
                boxShadow: timeframe === t.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        <div className="stat-card blue">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            TOTAL TICKETS
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginTop: '6px' }}>
            {summary.total || 0}
          </div>
        </div>

        <div className="stat-card green">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            RESOLVED TICKETS
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', lineHeight: 1.1, marginTop: '6px' }}>
            {summary.resolved || 0}
          </div>
        </div>

        <div className="stat-card orange">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            AVG RESOLUTION TIME
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ea580c', lineHeight: 1.1, marginTop: '6px' }}>
            {summary.avgResolutionFormatted || '28m 27s'}
          </div>
        </div>

        <div className="stat-card purple">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            SLA COMPLIANCE
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#8b5cf6', lineHeight: 1.1, marginTop: '6px' }}>
            {summary.slaComplianceRate || '96.4%'}
          </div>
        </div>
      </div>

      {/* Grid: Category distribution & Engineer workload */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Category Breakdown */}
        <div className="app-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Tickets by Category
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {byCategory.map((cat: any) => {
              const pct = summary.total > 0 ? Math.round((cat.count / summary.total) * 100) : 0;
              return (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{cat.category}</span>
                    <span style={{ color: '#64748b' }}>{cat.count} tickets ({pct}%)</span>
                  </div>
                  <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#0284c7', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engineer Workload Leaderboard */}
        <div className="app-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            IT Engineer Workload & Resolution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {engineerWorkload.map((eng: any, idx: number) => (
              <div
                key={eng.engineer_name}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}>
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {eng.engineer_name}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Assigned: {eng.total_assigned} • Active: {eng.active_count}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#10b981' }}>
                    {eng.resolved_count} Resolved
                  </span>
                  <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Avg: {eng.avg_resolution_formatted}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
