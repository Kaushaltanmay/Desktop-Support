import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CheckCircle2, XCircle, Clock, Calendar, Search, Filter, MessageSquare, X, AlertCircle } from 'lucide-react';

interface HRLeaveRequestsViewProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const HRLeaveRequestsView: React.FC<HRLeaveRequestsViewProps> = ({ showToast }) => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Review Dialog Modal
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.leaves.getAll(params);
      setLeaves(res.leaves || []);
    } catch (err) {
      console.error('Failed to load leaves for HR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleOpenReview = (leave: any, type: 'APPROVE' | 'REJECT') => {
    setSelectedLeave(leave);
    setActionType(type);
    setReviewComment(type === 'APPROVE' ? 'Approved by HR' : '');
    setError('');
  };

  const handleExecuteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionType === 'REJECT' && !reviewComment.trim()) {
      setError('Please provide a reason when rejecting a leave request.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      if (actionType === 'APPROVE') {
        await api.leaves.approve(selectedLeave.id, reviewComment);
        showToast(`Leave request #${selectedLeave.id} approved.`);
      } else {
        await api.leaves.reject(selectedLeave.id, reviewComment);
        showToast(`Leave request #${selectedLeave.id} rejected.`);
      }
      setSelectedLeave(null);
      fetchLeaves();
    } catch (err: any) {
      setError(err.message || 'Failed to process leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      
      {/* Title & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Workforce Leave Approvals & Triage
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Review employee time-off applications, verify quotas, and record approval audit trails.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '170px' }}
          >
            <option value="all">All Requests</option>
            <option value="PENDING">Pending Review ({pendingCount})</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="app-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
            Leave Applications Queue
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {leaves.length} Application(s)
          </span>
        </div>

        <div className="table-responsive-wrapper">
          <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Employee</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Leave Category</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Duration</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Date Range</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Reason</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    No leave requests found for this filter.
                  </td>
                </tr>
              ) : (
                leaves.map((l: any) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{l.employee_name}</p>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {l.emp_code} • {l.department_name || 'Staff'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{l.leave_type_name}</span>
                      <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#64748b' }}>
                        {l.leave_type_code}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0284c7' }}>
                      {l.number_of_days} day{l.number_of_days > 1 ? 's' : ''}
                    </td>

                    <td style={{ padding: '14px 20px', color: '#334155' }}>
                      {l.start_date === l.end_date
                        ? l.start_date
                        : `${l.start_date} to ${l.end_date}`}
                    </td>

                    <td style={{ padding: '14px 20px', color: '#475569', maxWidth: '220px' }}>
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

                    <td style={{ padding: '14px 20px' }}>
                      {l.status === 'PENDING' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenReview(l, 'APPROVE')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#059669',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReview(l, 'REJECT')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {l.reviewer_name ? `Reviewed by ${l.reviewer_name}` : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedLeave && (
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
            maxWidth: '500px',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: actionType === 'APPROVE' ? '#059669' : '#dc2626' }}>
                {actionType === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <button
                onClick={() => setSelectedLeave(null)}
                style={{ background: 'transparent', padding: '4px', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '16px' }}>
              {selectedLeave.employee_name} requested <strong>{selectedLeave.number_of_days} day(s)</strong> of {selectedLeave.leave_type_name} ({selectedLeave.start_date} to {selectedLeave.end_date}).
            </p>

            {error && (
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
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleExecuteReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  HR Remarks / Review Comment {actionType === 'REJECT' && '*'}
                </label>
                <textarea
                  rows={3}
                  placeholder={actionType === 'APPROVE' ? 'Optional remarks for employee...' : 'Please specify the rejection rationale...'}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedLeave(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    background: actionType === 'APPROVE' ? '#10b981' : '#dc2626',
                    color: '#ffffff',
                    fontWeight: 700
                  }}
                >
                  {submitting ? 'Processing...' : actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
