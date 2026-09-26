import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Calendar, Clock, CheckCircle2, AlertTriangle, ShieldAlert, Award, ChevronLeft, ChevronRight } from 'lucide-react';

export const EmployeeAttendanceView: React.FC = () => {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.attendance.getMyHistory(month);
      setData(res);
    } catch (err) {
      console.error('Failed to load my attendance history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [month]);

  const summary = data?.summary || {
    presentDays: 0,
    halfDays: 0,
    leaveDays: 0,
    absentDays: 0,
    overtimeMinutes: 0,
    overtimeFormatted: '0h 00m'
  };

  const records = data?.records || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      
      {/* Title & Month Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            My Attendance Records
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Monthly working hours breakdown, biometric timestamps, and overtime telemetry.
          </p>
        </div>

        {/* Month Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#0f172a'
            }}
          />
        </div>
      </div>

      {/* Top Monthly Summary Cards (Section 15) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
      }}>
        <div className="stat-card green">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Present Days</span>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {summary.presentDays}
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>Standard Working Days</span>
        </div>

        <div className="stat-card orange">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Half Days</span>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {summary.halfDays}
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 600 }}>4h to 8h Shifts</span>
        </div>

        <div className="stat-card purple">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Approved Leaves</span>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {summary.leaveDays}
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <Calendar size={18} />
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 600 }}>Casual / Sick / Earned</span>
        </div>

        <div className="stat-card blue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Accumulated Overtime</span>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                {summary.overtimeFormatted}
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Clock size={18} />
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600 }}>Recorded OT Hours</span>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="app-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
            Daily Logs for {month}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Showing {records.length} logged record(s)
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Punch In</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Punch Out</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Working Hours</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Overtime</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    No attendance records logged for this month.
                  </td>
                </tr>
              ) : (
                records.map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>
                      {new Date(r.attendance_date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>
                      {r.punch_in_at
                        ? new Date(r.punch_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                      {r.late_minutes > 0 && (
                        <span style={{ marginLeft: '6px', fontSize: '0.68rem', color: '#ea580c', fontWeight: 700 }}>
                          ({r.late_minutes}m late)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>
                      {r.punch_out_at
                        ? new Date(r.punch_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : r.punch_in_at ? 'Working...' : '--:--'}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0284c7' }}>
                      {r.total_work_formatted}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={
                        r.status === 'PRESENT' ? 'badge-resolved' :
                        r.status === 'HALF_DAY' ? 'badge-open' :
                        r.status === 'WORKING' ? 'badge-in-progress' :
                        r.status === 'LEAVE' ? 'badge-waiting' : 'priority-critical'
                      }>
                        {r.status}
                      </span>
                      {r.is_corrected === 1 && (
                        <span style={{ marginLeft: '6px', fontSize: '0.65rem', background: '#f1f5f9', padding: '1px 4px', borderRadius: '4px', color: '#475569' }}>
                          HR Adjusted
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', color: r.overtime_minutes > 0 ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                      {r.overtime_minutes > 0 ? `${r.overtime_formatted} OT` : '0'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
