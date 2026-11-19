import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Calendar, PlusCircle, CheckCircle2, XCircle, Clock, AlertCircle, Send, X } from 'lucide-react';

interface LeaveManagementViewProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({ showToast }) => {
  const [balances, setBalances] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Form State
  const [selectedType, setSelectedType] = useState<number>(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const [balRes, typesRes, leavesRes] = await Promise.all([
        api.leaves.getBalances().catch(() => ({ balances: [] })),
        api.leaves.getTypes().catch(() => ({ types: [] })),
        api.leaves.getAll().catch(() => ({ leaves: [] }))
      ]);

      if (balRes?.balances) setBalances(balRes.balances);
      if (typesRes?.types) {
        setLeaveTypes(typesRes.types);
        if (typesRes.types.length > 0) setSelectedType(typesRes.types[0].id);
      }
      if (leavesRes?.leaves) setLeaves(leavesRes.leaves);
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setFormError('Please fill in start date, end date, and reason.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.leaves.apply({
        leave_type_id: Number(selectedType),
        start_date: startDate,
        end_date: endDate,
        reason
      });
      showToast(`Leave application submitted successfully (${res.numberOfDays} days).`);
      setIsApplyModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaveData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      
      {/* Title & Apply Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Leave Management & Entitlements
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            View allocated leave quotas, submit time-off requests, and monitor HR approvals.
          </p>
        </div>

        <button
          id="btn-open-apply-leave"
          onClick={() => setIsApplyModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0284c7',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
          }}
        >
          <PlusCircle size={18} />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balance Quota Cards */}
      <div className="stat-grid-2col" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        {balances.map(b => (
          <div key={b.id} className="app-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {b.leave_type_name}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7' }}>
                {b.leave_type_code}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                {b.remaining_days}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                / {b.allocated_days} days remaining
              </span>
            </div>

            {/* Subtle Progress Bar */}
            <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (b.remaining_days / Math.max(1, b.allocated_days)) * 100)}%`,
                backgroundColor: b.remaining_days <= 2 ? '#ef4444' : '#10b981',
                borderRadius: '3px'
              }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Used: {b.used_days} days</span>
          </div>
        ))}
      </div>

      {/* Leave Requests Table */}
      <div className="app-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
            My Leave Applications
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {leaves.length} Total Application(s)
          </span>
        </div>

        <div className="table-responsive-wrapper">
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Leave Type</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Duration</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Dates</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Reason</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>HR Review</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    No leave applications found. Click "Apply for Leave" above to submit one.
                  </td>
                </tr>
              ) : (
                leaves.map((l: any) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>
                      {l.leave_type_name} ({l.leave_type_code})
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0284c7' }}>
                      {l.number_of_days} day{l.number_of_days > 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>
                      {l.start_date === l.end_date
                        ? l.start_date
                        : `${l.start_date} to ${l.end_date}`}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155', maxWidth: '240px' }}>
                      {l.reason}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={
                        l.status === 'APPROVED' ? 'badge-resolved' :
                        l.status === 'PENDING' ? 'badge-waiting' : 'priority-critical'
                      }>
                        {l.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.78rem', color: '#64748b' }}>
                      {l.review_comment ? (
                        <span>
                          <strong style={{ color: '#0f172a' }}>{l.reviewer_name || 'HR'}:</strong> {l.review_comment}
                        </span>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Awaiting review</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
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
            maxWidth: '520px',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={22} color="#0284c7" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                  Apply for Time-Off / Leave
                </h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                style={{ background: 'transparent', padding: '4px', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
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
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Leave Category
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(Number(e.target.value))}
                  style={{ width: '100%' }}
                >
                  {leaveTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Reason for Time-Off
                </label>
                <textarea
                  rows={3}
                  placeholder="Please state the purpose of your leave request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700
                  }}
                >
                  <Send size={15} />
                  <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
