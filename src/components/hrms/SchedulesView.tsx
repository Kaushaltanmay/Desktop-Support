import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Clock, Shield, CheckCircle2, AlertCircle, Info, Calendar } from 'lucide-react';

export const SchedulesView: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const res = await api.schedules.getAll();
        setSchedules(res.schedules || []);
      } catch (err) {
        console.error('Failed to load schedules:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Work Schedules & Attendance Policy Rules
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Configurable shift timings, grace periods, half-day/full-day thresholds, and overtime parameters.
        </p>
      </div>

      {/* Schedules Cards */}
      <div className="grid-responsive-cards" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '18px'
      }}>
        {schedules.map(s => (
          <div key={s.id} className="app-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                    {s.schedule_name}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Standard Office Shift
                  </span>
                </div>
              </div>

              {s.is_default === 1 && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '8px',
                  background: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0'
                }}>
                  Default Active
                </span>
              )}
            </div>

            {/* Timings Highlight */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              textAlign: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Shift Start</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {s.start_time} AM
                </p>
              </div>
              <div style={{ width: '1px', height: '32px', background: '#cbd5e1' }} />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Shift End</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {s.end_time} PM
                </p>
              </div>
              <div style={{ width: '1px', height: '32px', background: '#cbd5e1' }} />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Duration</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                  {s.expected_hours}h 00m
                </p>
              </div>
            </div>

            {/* Attendance Calculation Thresholds */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', padding: '10px 12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Grace Period</span>
                <p style={{ fontWeight: 700, color: '#0f172a' }}>{s.grace_period_minutes} Minutes</p>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Punches before 09:40 not flagged late</span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', padding: '10px 12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Full Day Minimum</span>
                <p style={{ fontWeight: 700, color: '#059669' }}>&gt;= {s.full_day_min_hours} Hours</p>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Marked as PRESENT</span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', padding: '10px 12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Half Day Minimum</span>
                <p style={{ fontWeight: 700, color: '#ea580c' }}>&gt;= {s.half_day_min_hours} Hours</p>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Between 4h and 8h</span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', padding: '10px 12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Overtime Threshold</span>
                <p style={{ fontWeight: 700, color: '#0284c7' }}>&gt; {s.standard_daily_minutes} Min (9h)</p>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Logged into overtime hours</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
