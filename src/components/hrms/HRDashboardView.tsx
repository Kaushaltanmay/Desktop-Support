import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { AttendanceMapModal } from './AttendanceMapModal';

interface HRDashboardViewProps {
  onNavigateToLeaves: () => void;
  onNavigateToAttendance: () => void;
}

export const HRDashboardView: React.FC<HRDashboardViewProps> = ({
  onNavigateToLeaves,
  onNavigateToAttendance
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecordForMap, setSelectedRecordForMap] = useState<any | null>(null);

  const fetchHRDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.hr.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load HR dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRDashboard();
  }, []);

  const metrics = data?.metrics || {
    totalEmployees: 38,
    presentToday: 25,
    absentToday: 5,
    onLeaveToday: 6,
    halfDayToday: 2,
    overtimeToday: 8,
    lateToday: 4,
    pendingLeaveRequests: 0
  };

  const roster = data?.todayRoster || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      
      {/* Top Welcome & Notification Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85, fontWeight: 700 }}>
            Human Resources Management Command
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>
            Workforce Attendance & Field Telemetry
          </h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px' }}>
            Biometric GPS geofencing, daily punch in/out verification, and real-time absence tracking.
          </p>
        </div>

        {metrics.pendingLeaveRequests > 0 && (
          <button
            onClick={onNavigateToLeaves}
            style={{
              background: '#ffffff',
              color: '#0284c7',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <span>Review {metrics.pendingLeaveRequests} Pending Leave(s)</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* 6 Top Metric Cards (Section 16 & Section 42) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
      }}>
        <div className="stat-card blue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Workforce</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {metrics.totalEmployees}
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Users size={18} />
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600 }}>Active Headcount</span>
        </div>

        <div className="stat-card green">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Present Today</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                {metrics.presentToday}
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>Punched & Verified</span>
        </div>

        <div className="stat-card orange">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Half Day Today</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                {metrics.halfDayToday}
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <Clock size={18} />
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 600 }}>Partial Shifts</span>
        </div>

        <div className="stat-card purple">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>On Leave Today</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>
                {metrics.onLeaveToday}
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <Calendar size={18} />
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 600 }}>Scheduled Time-Off</span>
        </div>

        <div className="stat-card orange">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Late Arrivals</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                {metrics.lateToday}
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 600 }}>After 09:40 AM Grace</span>
        </div>

        <div className="stat-card blue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Overtime Today</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                {metrics.overtimeToday}
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Clock size={18} />
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600 }}>&gt; 9h Daily Work</span>
        </div>
      </div>

      {/* Today's Workforce Attendance Roster Table */}
      <div className="app-card" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Today's Live Attendance Roster
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Biometric check-in status and GPS office verification for {data?.today || 'today'}
            </p>
          </div>

          <button
            onClick={onNavigateToAttendance}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#0284c7'
            }}
          >
            <span>Full History & Filters</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Employee</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Department</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Punch In</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Punch Out</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Working Duration</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Location Verification</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r: any) => (
                <tr key={r.employee_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#8b5cf6',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}>
                        {r.employee_name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{r.employee_name}</p>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.emp_code || 'EMP'}</span>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '14px 20px', color: '#475569', fontWeight: 500 }}>
                    {r.department_name || 'General Staff'}
                  </td>

                  <td style={{ padding: '14px 20px', color: '#334155' }}>
                    {r.punch_in_at
                      ? new Date(r.punch_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                    {r.late_minutes > 0 && (
                      <span style={{ display: 'block', fontSize: '0.68rem', color: '#ea580c', fontWeight: 700 }}>
                        {r.late_minutes}m late
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
                    {r.overtime_minutes > 0 && (
                      <span style={{ display: 'block', fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>
                        +{r.overtime_formatted} OT
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <span className={
                      r.effective_status === 'PRESENT' ? 'badge-resolved' :
                      r.effective_status === 'WORKING' ? 'badge-in-progress' :
                      r.effective_status === 'HALF_DAY' ? 'badge-open' :
                      r.effective_status === 'LEAVE' ? 'badge-waiting' : 'priority-critical'
                    }>
                      {r.effective_status}
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    {r.punch_in_latitude ? (
                      <button
                        onClick={() => setSelectedRecordForMap(r)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#059669',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        <MapPin size={12} />
                        <span>View on Map</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No GPS coordinates
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geolocation Map Modal */}
      {selectedRecordForMap && (
        <AttendanceMapModal
          isOpen={true}
          onClose={() => setSelectedRecordForMap(null)}
          record={selectedRecordForMap}
        />
      )}
    </div>
  );
};
