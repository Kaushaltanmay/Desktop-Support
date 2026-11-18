import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Filter, Calendar, MapPin, Edit3, CheckCircle2, Clock, X, AlertCircle, Fingerprint, Smartphone, DoorOpen, RefreshCw, Activity, XCircle, AlertTriangle, Cpu } from 'lucide-react';
import { AttendanceMapModal } from './AttendanceMapModal';

interface HRAttendanceManagementViewProps {
  departments: any[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const HRAttendanceManagementView: React.FC<HRAttendanceManagementViewProps> = ({
  departments,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'APP' | 'BIOMETRIC_DOOR'>('APP');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Separate Biometric Lab Door State
  const [labData, setLabData] = useState<{
    sessions: any[];
    currently_in_lab: any[];
    enrolled_employees: any[];
    recent_logs?: any[];
    pending_commands?: any[];
    summary: { inside_now: number; entries_today: number; enrolled_count: number };
  } | null>(null);
  const [labLoading, setLabLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [selectedRecordForMap, setSelectedRecordForMap] = useState<any | null>(null);
  const [correctingRecord, setCorrectingRecord] = useState<any | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [newStatus, setNewStatus] = useState('PRESENT');
  const [newPunchIn, setNewPunchIn] = useState('');
  const [newPunchOut, setNewPunchOut] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionError, setCorrectionError] = useState('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedDept !== 'all') params.department_id = selectedDept;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (search) params.search = search;

      const res = await api.attendance.getAll(params);
      setRecords(res.records || []);
    } catch (err) {
      console.error('Failed to load attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabDoorAttendance = async (silent = false) => {
    try {
      if (!silent) setLabLoading(true);
      const params: Record<string, string> = {};
      if (selectedDate) params.date = selectedDate;
      if (search) params.search = search;
      const res = await api.biometric.getLabAttendance(params);
      setLabData(res);
    } catch (err) {
      console.error('Failed to load biometric lab door attendance:', err);
    } finally {
      if (!silent) setLabLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'APP') {
      fetchRecords();
    } else {
      fetchLabDoorAttendance();
    }
  }, [activeTab, selectedDate, selectedDept, selectedStatus, search]);

  useEffect(() => {
    if (activeTab !== 'BIOMETRIC_DOOR') return;
    const t = setInterval(() => fetchLabDoorAttendance(true), 3000);
    return () => clearInterval(t);
  }, [activeTab, selectedDate, search]);

  const handleOpenCorrection = (record: any) => {
    setCorrectingRecord(record);
    setNewStatus(record.status || 'PRESENT');
    setNewPunchIn(record.punch_in_at ? new Date(record.punch_in_at).toISOString().slice(0, 16) : '');
    setNewPunchOut(record.punch_out_at ? new Date(record.punch_out_at).toISOString().slice(0, 16) : '');
    setCorrectionReason('');
    setCorrectionError('');
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      setCorrectionError('A valid justification reason is required for manual HR adjustments.');
      return;
    }

    try {
      setSubmittingCorrection(true);
      setCorrectionError('');
      await api.attendance.correct(correctingRecord.id, {
        punch_in_at: newPunchIn || undefined,
        punch_out_at: newPunchOut || undefined,
        status: newStatus,
        reason: correctionReason
      });
      showToast('Attendance record updated and audit log recorded.');
      setCorrectingRecord(null);
      fetchRecords();
    } catch (err: any) {
      setCorrectionError(err.message || 'Failed to update attendance record.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">

      {/* Title & Source Switcher (Strictly Separated: App GPS vs ESP32 Lab Door Fingerprint) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Workforce Attendance &amp; Biometric Lab Door
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
            App GPS Punch In/Out and ESP32 Lab Door Fingerprint records are tracked strictly separately.
          </p>
        </div>

        <div style={{
          display: 'inline-flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '11px',
          border: '1px solid #e2e8f0',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('APP')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'APP' ? '#ffffff' : 'transparent',
              color: activeTab === 'APP' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'APP' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Smartphone size={15} />
            App Attendance (GPS)
          </button>

          <button
            onClick={() => setActiveTab('BIOMETRIC_DOOR')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'BIOMETRIC_DOOR' ? '#ffffff' : 'transparent',
              color: activeTab === 'BIOMETRIC_DOOR' ? '#059669' : '#64748b',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'BIOMETRIC_DOOR' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Fingerprint size={15} />
            Biometric Lab Door (ESP32)
          </button>
        </div>
      </div>

      {/* ==================== TAB 2: SEPARATE BIOMETRIC LAB DOOR (ESP32 FINGERPRINT) ==================== */}
      {activeTab === 'BIOMETRIC_DOOR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Summary Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="app-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Currently Inside Lab</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                {labData?.summary?.inside_now ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Active IN_LAB door sessions</div>
            </div>

            <div className="app-card" style={{ padding: '16px 20px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Lab Entries Today</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                {labData?.summary?.entries_today ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total fingerprint door punches today</div>
            </div>

            <div className="app-card" style={{ padding: '16px 20px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Enrolled UART Fingerprints</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>
                {labData?.summary?.enrolled_count ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Registered on R307 UART slots</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="app-card" style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="Search employee name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px' }}
              />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: '165px' }}
            />
            <button
              onClick={() => fetchLabDoorAttendance(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {/* Enrolled Employees Biometric UART Directory */}
          <div className="app-card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fingerprint size={18} color="#0284c7" />
              Enrolled Employees — Biometric UART Slots (R307)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>UART Slot</th>
                    <th style={{ padding: '10px 12px' }}>Employee</th>
                    <th style={{ padding: '10px 12px' }}>Department</th>
                    <th style={{ padding: '10px 12px' }}>Device</th>
                    <th style={{ padding: '10px 12px' }}>Current Lab Status</th>
                    <th style={{ padding: '10px 12px' }}>Last Lab IN</th>
                    <th style={{ padding: '10px 12px' }}>Last Lab OUT</th>
                  </tr>
                </thead>
                <tbody>
                  {(labData?.enrolled_employees || []).map((emp: any) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 800, color: '#0369a1' }}>
                        UART Slot #{emp.fingerprint_slot}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                        {emp.employee_name} <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.74rem' }}>({emp.emp_code || emp.role})</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{emp.department_name || 'General'}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#475569' }}>{emp.device_id}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: emp.current_lab_status === 'IN_LAB' ? '#dcfce7' : '#f1f5f9',
                          color: emp.current_lab_status === 'IN_LAB' ? '#166534' : '#475569'
                        }}>
                          {emp.current_lab_status === 'IN_LAB' ? '● IN LAB' : 'OUT LAB'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#0f172a' }}>
                        {emp.last_lab_in ? new Date(emp.last_lab_in).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#0f172a' }}>
                        {emp.last_lab_out ? new Date(emp.last_lab_out).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Biometric Lab Door Entry/Exit Register */}
          <div className="app-card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DoorOpen size={18} color="#059669" />
              Lab Door Entry / Exit History (Fingerprint Only)
            </h3>
            {labLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading Lab Door records...</div>
            ) : (labData?.sessions || []).length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                No fingerprint Lab IN / OUT entries yet. Scan an enrolled finger on the ESP32 door terminal to log Lab entry and exit times!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px 12px' }}>Date</th>
                      <th style={{ padding: '10px 12px' }}>Employee</th>
                      <th style={{ padding: '10px 12px' }}>UART Slot</th>
                      <th style={{ padding: '10px 12px' }}>Lab IN (Fingerprint)</th>
                      <th style={{ padding: '10px 12px' }}>Lab OUT (Fingerprint)</th>
                      <th style={{ padding: '10px 12px' }}>Time in Lab</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(labData?.sessions || []).map((s: any) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>{s.attendance_date}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                          {s.employee_name}
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>{s.department_name || s.role}</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>
                          Slot #{s.fingerprint_slot}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#059669', fontWeight: 700 }}>
                          {s.in_time ? new Date(s.in_time).toLocaleTimeString() : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#0284c7', fontWeight: 700 }}>
                          {s.out_time ? new Date(s.out_time).toLocaleTimeString() : 'Still Inside'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                          {s.out_time ? `${s.duration_minutes} min` : 'Active...'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: s.status === 'IN_LAB' ? '#dcfce7' : '#e0f2fe',
                            color: s.status === 'IN_LAB' ? '#166534' : '#0369a1'
                          }}>
                            {s.status === 'IN_LAB' ? '● IN LAB' : 'OUT LAB'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Live Biometric Activity Feed (Enrollments, Scans, Failures — Auto-Updates Every 3s!) */}
          <div className="app-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#059669" />
                Live Biometric Feed (Enrollments, Lab IN/OUT &amp; Failed Scans)
              </h3>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
                ● Auto-updating every 3s
              </span>
            </div>

            {(labData?.pending_commands || []).length > 0 && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #3b82f6',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                color: '#1e40af',
                fontWeight: 600
              }}>
                <Cpu size={16} />
                <span>
                  ESP32 Active Task: <strong>{labData?.pending_commands?.[0]?.command}</strong> UART Slot #{labData?.pending_commands?.[0]?.fingerprint_slot}
                  {labData?.pending_commands?.[0]?.employee_name ? ` (${labData?.pending_commands?.[0]?.employee_name})` : ''} — <strong>{labData?.pending_commands?.[0]?.status}</strong>
                </span>
              </div>
            )}

            {(labData?.recent_logs || []).length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', fontSize: '0.83rem' }}>
                No biometric events yet. Enrollments, Lab IN/OUT punches, and unrecognized finger alerts will appear live here!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                {(labData?.recent_logs || []).map((log: any) => {
                  const isOk = ['LAB_IN', 'LAB_OUT', 'PUNCH_IN', 'PUNCH_OUT', 'ENROLL_SUCCESS', 'DELETE_SUCCESS', 'CLEAR_ALL_SUCCESS'].includes(log.action);
                  const isWarn = ['COOLDOWN', 'ALREADY_COMPLETED', 'ENROLL_QUEUED'].includes(log.action);
                  return (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: isOk ? '#f0fdf4' : isWarn ? '#fffbeb' : '#fef2f2',
                        border: `1px solid ${isOk ? '#bbf7d0' : isWarn ? '#fde68a' : '#fecaca'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isOk ? (
                          <CheckCircle2 size={16} color="#059669" />
                        ) : isWarn ? (
                          <AlertTriangle size={16} color="#d97706" />
                        ) : (
                          <XCircle size={16} color="#dc2626" />
                        )}
                        <div>
                          <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#0f172a' }}>
                            {log.employee_name || 'Unknown Finger'} {log.fingerprint_slot ? `(UART Slot #${log.fingerprint_slot})` : ''}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#475569' }}>{log.message}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isOk ? '#dcfce7' : isWarn ? '#fef3c7' : '#fee2e2',
                          color: isOk ? '#166534' : isWarn ? '#92400e' : '#991b1b'
                        }}>
                          {log.action}
                        </span>
                        <div style={{ fontSize: '0.69rem', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                          <Clock size={10} />
                          {log.created_at ? new Date(log.created_at + 'Z').toLocaleTimeString() : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 1: EXISTING APP GPS ATTENDANCE (UNTOUCHED) ==================== */}
      {activeTab === 'APP' && (
        <>
          {/* Filter Toolbar */}
          <div className="app-card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="Search employee by name, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px' }}
              />
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: '160px' }}
              title="Filter by specific date"
            />

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="all">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="WORKING">Working (Active)</option>
              <option value="LEAVE">Leave</option>
              <option value="ABSENT">Absent</option>
            </select>

            {(selectedDate || selectedDept !== 'all' || selectedStatus !== 'all' || search) && (
              <button
                onClick={() => { setSelectedDate(''); setSelectedDept('all'); setSelectedStatus('all'); setSearch(''); }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#64748b'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Records Table */}
          <div className="app-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                Attendance Records Log
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {records.length} Record(s) Found
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Employee</th>
                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Date</th>
                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Punch In</th>
                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Punch Out</th>
                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Working Duration</th>
                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        No matching attendance records found.
                      </td>
                    </tr>
                  ) : (
                    records.map((r: any) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{r.employee_name}</p>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {r.emp_code} • {r.department_name || 'Staff'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 20px', color: '#334155' }}>
                          {new Date(r.attendance_date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>

                        <td style={{ padding: '14px 20px', color: '#334155' }}>
                          {r.punch_in_at
                            ? new Date(r.punch_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '--:--'}
                          {r.late_minutes > 0 && (
                            <span style={{ display: 'block', fontSize: '0.68rem', color: '#ea580c', fontWeight: 700 }}>
                              ({r.late_minutes}m late)
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 20px', color: '#334155' }}>
                          {r.punch_out_at
                            ? new Date(r.punch_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : r.punch_in_at ? 'In Progress' : '--:--'}
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
                            r.status === 'PRESENT' ? 'badge-resolved' :
                              r.status === 'WORKING' ? 'badge-in-progress' :
                                r.status === 'HALF_DAY' ? 'badge-open' :
                                  r.status === 'LEAVE' ? 'badge-waiting' : 'priority-critical'
                          }>
                            {r.status}
                          </span>
                          {r.is_corrected === 1 && (
                            <span style={{ display: 'block', marginTop: '3px', fontSize: '0.65rem', background: '#f1f5f9', padding: '1px 4px', borderRadius: '4px', color: '#475569' }}>
                              HR Adjusted
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {r.punch_in_latitude && (
                              <button
                                onClick={() => setSelectedRecordForMap(r)}
                                title="View GPS Geofence Map"
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  background: '#ecfdf5',
                                  border: '1px solid #a7f3d0',
                                  color: '#059669',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <MapPin size={12} />
                                <span>Map</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenCorrection(r)}
                              title="Manually Correct Record (Audited)"
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#0284c7',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Edit3 size={12} />
                              <span>Correct</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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

          {/* HR Manual Correction Modal (Section 18) */}
          {correctingRecord && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1200,
              padding: '20px'
            }}>
              <div className="app-card animate-fade-in" style={{
                width: '100%',
                maxWidth: '540px',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Edit3 size={20} color="#0284c7" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                      HR Attendance Adjustment (Audited)
                    </h3>
                  </div>
                  <button
                    onClick={() => setCorrectingRecord(null)}
                    style={{ background: 'transparent', padding: '4px', color: '#64748b' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
                  Adjusting record for <strong>{correctingRecord.employee_name}</strong> on {correctingRecord.attendance_date}. Every manual change creates an immutable audit log.
                </p>

                {correctionError && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#dc2626',
                    fontSize: '0.82rem',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} />
                    <span>{correctionError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Attendance Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="HALF_DAY">HALF DAY</option>
                      <option value="ABSENT">ABSENT</option>
                      <option value="LEAVE">LEAVE</option>
                      <option value="ON_DUTY">ON DUTY / FIELD WORK</option>
                      <option value="WORK_FROM_HOME">WORK FROM HOME</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Punch In Timestamp
                      </label>
                      <input
                        type="datetime-local"
                        value={newPunchIn}
                        onChange={(e) => setNewPunchIn(e.target.value)}
                        style={{ width: '100%', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Punch Out Timestamp
                      </label>
                      <input
                        type="datetime-local"
                        value={newPunchOut}
                        onChange={(e) => setNewPunchOut(e.target.value)}
                        style={{ width: '100%', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Justification Reason (Mandatory for Audit Trail) *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Employee forgot Punch Out due to approved off-site client deployment."
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      required
                      style={{ width: '100%', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setCorrectingRecord(null)}
                      style={{ padding: '8px 16px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCorrection}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '8px',
                        background: '#0284c7',
                        color: '#ffffff',
                        fontWeight: 700
                      }}
                    >
                      {submittingCorrection ? 'Saving...' : 'Save & Record Audit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
