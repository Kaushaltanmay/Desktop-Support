import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  X, 
  Clock, 
  User, 
  Building2, 
  Laptop, 
  Send, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Shield, 
  FileText,
  CornerDownRight,
  MessageSquare
} from 'lucide-react';

interface TicketDetailModalProps {
  ticketId: string | number;
  currentUser: any;
  engineers: any[];
  onClose: () => void;
  onTicketUpdated: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticketId,
  currentUser,
  engineers,
  onClose,
  onTicketUpdated
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Modals for resolving or reopening
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const res = await api.tickets.getById(ticketId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      await api.tickets.addComment(ticketId, commentText.trim());
      setCommentText('');
      await fetchTicketDetails();
      onTicketUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAssign = async (engineerId: number) => {
    try {
      setActionLoading(true);
      await api.tickets.assign(ticketId, engineerId);
      await fetchTicketDetails();
      onTicketUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to assign engineer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      alert('Please provide resolution notes.');
      return;
    }

    try {
      setActionLoading(true);
      await api.tickets.resolve(ticketId, resolutionNotes.trim());
      setIsResolveModalOpen(false);
      setResolutionNotes('');
      await fetchTicketDetails();
      onTicketUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.tickets.reopen(ticketId, reopenReason.trim() || undefined);
      setIsReopenModalOpen(false);
      setReopenReason('');
      await fetchTicketDetails();
      onTicketUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
      }}>
        <div className="app-card" style={{ padding: '30px', background: '#fff' }}>
          Loading ticket details...
        </div>
      </div>
    );
  }

  const ticket = data?.ticket;
  const comments = data?.comments || [];
  const audits = data?.audits || [];

  const isEngineerOrAdmin = currentUser?.role === 'IT_ENGINEER' || currentUser?.role === 'ADMIN';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '20px'
    }}>
      <div className="app-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0284c7',
                fontFamily: 'var(--font-mono)'
              }}>
                #{ticket?.ticket_number}
              </span>
              <span className={
                ticket?.status === 'RESOLVED' ? 'badge-resolved' :
                ticket?.status === 'IN PROGRESS' ? 'badge-in-progress' :
                ticket?.status === 'OPEN' ? 'badge-open' : 'badge-waiting'
              }>
                {ticket?.status}
              </span>
              <span className={
                ticket?.priority === 'CRITICAL' ? 'priority-critical' :
                ticket?.priority === 'HIGH' ? 'priority-high' :
                ticket?.priority === 'MEDIUM' ? 'priority-medium' : 'priority-low'
              }>
                {ticket?.priority}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                {ticket?.category}
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
              {ticket?.subject}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Employee & Machine Information Card */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          fontSize: '0.82rem'
        }}>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={13} /> Employee Requester
            </span>
            <p style={{ fontWeight: 700, color: '#0f172a' }}>{ticket?.creator_name}</p>
            <p style={{ color: '#64748b', fontSize: '0.75rem' }}>{ticket?.creator_email}</p>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building2 size={13} /> Department
            </span>
            <p style={{ fontWeight: 700, color: '#0f172a' }}>{ticket?.department_name || 'General'}</p>
            <p style={{ color: '#64748b', fontSize: '0.75rem' }}>ID: {ticket?.creator_employee_id || 'N/A'}</p>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Laptop size={13} /> Assigned Workstation
            </span>
            <p style={{ fontWeight: 700, color: '#0284c7' }}>
              {ticket?.asset_tag ? `${ticket.asset_tag} (${ticket.device_name})` : 'None / Not mapped'}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
              {ticket?.device_model ? `${ticket.device_model} • ${ticket.operating_system}` : ''}
            </p>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={13} /> Assigned IT Engineer
            </span>
            <p style={{ fontWeight: 700, color: ticket?.assignee_name ? '#0f172a' : '#f97316' }}>
              {ticket?.assignee_name || 'Unassigned'}
            </p>
            {isEngineerOrAdmin && (
              <div style={{ marginTop: '4px' }}>
                <select
                  value={ticket?.assigned_to || ''}
                  onChange={(e) => handleAssign(Number(e.target.value))}
                  disabled={actionLoading}
                  style={{ fontSize: '0.72rem', padding: '3px 6px', borderRadius: '4px' }}
                >
                  <option value="" disabled>Reassign...</option>
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.id}>{eng.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Issue Description */}
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            Problem Description
          </h4>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 18px',
            fontSize: '0.9rem',
            color: '#334155',
            lineHeight: 1.5
          }}>
            {ticket?.description}
          </div>
        </div>

        {/* Resolution Notes Box (if resolved) */}
        {ticket?.status === 'RESOLVED' && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span>Ticket Resolution</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                Resolution Time: {ticket.resolution_time_formatted || 'N/A'}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#166534', fontStyle: 'italic', lineHeight: 1.4 }}>
              "{ticket.resolution_notes}"
            </p>
            <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '2px' }}>
              Resolved by: <strong>{ticket.resolver_name || 'IT Support'}</strong> on {new Date(ticket.resolved_at).toLocaleString()}
            </div>
          </div>
        )}

        {/* Action Toolbar for Engineer & Employee */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
          {/* Resolve Ticket (Engineer/Admin only) */}
          {isEngineerOrAdmin && ticket?.status !== 'RESOLVED' && ticket?.status !== 'CLOSED' && (
            <button
              onClick={() => setIsResolveModalOpen(true)}
              style={{
                background: '#10b981',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={15} strokeWidth={3} />
              <span>Resolve Ticket</span>
            </button>
          )}

          {/* Reopen Ticket (if resolved or closed) */}
          {(ticket?.status === 'RESOLVED' || ticket?.status === 'CLOSED') && (
            <button
              onClick={() => setIsReopenModalOpen(true)}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#ea580c',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={15} />
              <span>Reopen Ticket</span>
            </button>
          )}
        </div>

        {/* Section: Ticket Timeline (Section 6 requirement!) */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="#0284c7" /> Complete Ticket Event Timeline
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '2px solid #e2e8f0', paddingLeft: '18px', marginLeft: '8px' }}>
            {audits.map((event: any, idx: number) => {
              const dt = new Date(event.created_at);
              const dateStr = dt.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
              const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Dot */}
                  <span style={{
                    position: 'absolute',
                    left: '-24px',
                    top: '4px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: event.action === 'TICKET_RESOLVED' ? '#10b981' : '#0284c7',
                    border: '2px solid #ffffff'
                  }} />

                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', gap: '8px' }}>
                    <span>{dateStr}</span>
                    <span>•</span>
                    <span>{timeStr}</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                    {event.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Discussion & Comments */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={16} color="#0284c7" /> Comments & Replies ({comments.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {comments.map((c: any) => (
              <div
                key={c.id}
                style={{
                  background: c.author_role === 'IT_ENGINEER' ? '#f0f9ff' : '#f8fafc',
                  border: `1px solid ${c.author_role === 'IT_ENGINEER' ? '#bae6fd' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  padding: '12px 16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{c.author_name}</span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: c.author_role === 'IT_ENGINEER' ? '#0284c7' : '#64748b',
                      color: '#ffffff'
                    }}>
                      {c.author_role}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>
                  {c.comment}
                </p>
              </div>
            ))}
          </div>

          {/* Add Reply form */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Write a reply or technical response..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ flex: 1, fontSize: '0.85rem' }}
            />
            <button
              type="submit"
              disabled={submittingComment}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                padding: '0 18px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Send size={14} />
              <span>Reply</span>
            </button>
          </form>
        </div>
      </div>

      {/* Resolve Ticket Modal */}
      {isResolveModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px'
        }}>
          <div className="app-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '28px', background: '#fff', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Resolve Incident #{ticket?.ticket_number}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
              Please describe the steps taken to fix the issue. Resolution notes will be recorded in the audit log and shared with the employee.
            </p>

            <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Resolution Notes *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Reinstalled network driver and restarted system."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  style={{ background: '#f1f5f9', color: '#475569', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ background: '#10b981', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Ticket Modal */}
      {isReopenModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px'
        }}>
          <div className="app-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '28px', background: '#fff', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Reopen Ticket #{ticket?.ticket_number}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
              State why this ticket is being reopened (e.g. issue resurfaced or only partially resolved).
            </p>

            <form onSubmit={handleReopen} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Reopen Reason
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Screen started flickering again after rebooting..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  style={{ background: '#f1f5f9', color: '#475569', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ background: '#ea580c', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  Reopen Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
