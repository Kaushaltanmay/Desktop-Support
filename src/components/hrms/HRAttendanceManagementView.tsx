import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Filter, Calendar, MapPin, Edit3, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';
import { AttendanceMapModal } from './AttendanceMapModal';

interface HRAttendanceManagementViewProps {
  departments: any[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const HRAttendanceManagementView: React.FC<HRAttendanceManagementViewProps> = ({
  departments,
  showToast
}) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchRecords();
  }, [selectedDate, selectedDept, selectedStatus, search]);

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
      
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Workforce Attendance Management & Triage
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Inspect biometric check-in timestamps, GPS geofence verifications, and perform audited corrections.
        </p>
      </div>

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
    </div>
  );
};
