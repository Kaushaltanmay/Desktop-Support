import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  MessageSquareWarning, 
  Send, 
  Volume2, 
  UserX, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Lock, 
  Eye, 
  UserCheck, 
  Info, 
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';

interface TeamFeedbackViewProps {
  currentUser: any;
  users: any[];
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TeamFeedbackView: React.FC<TeamFeedbackViewProps> = ({
  currentUser,
  users = [],
  showToast
}) => {
  const isHR = currentUser?.role === 'HR' || currentUser?.role === 'ADMIN';

  // Sub-tab: For HR, default to Desk view, for employees default to filing form
  const [activeTab, setActiveTab] = useState<'NEW_REPORT' | 'HR_DESK'>(isHR ? 'HR_DESK' : 'NEW_REPORT');

  // Form State
  const [reportedAgainstId, setReportedAgainstId] = useState<string>('');
  const [category, setCategory] = useState<string>('NOISE_DISTURBANCE');
  const [severity, setSeverity] = useState<string>('MEDIUM');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Grievances List State
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // HR Review Modal State
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>('UNDER_REVIEW');
  const [hrNotes, setHrNotes] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.feedback.getAll();
      setFeedbacks(res.feedbacks || []);
    } catch (err: any) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setFormError('Please enter both a subject and a description of the issue.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.feedback.create({
        reported_against_id: reportedAgainstId ? Number(reportedAgainstId) : null,
        category,
        severity,
        subject: subject.trim(),
        description: description.trim(),
        is_anonymous: isAnonymous
      });

      setFormSuccess(res.message || 'Workplace feedback submitted confidentially to HR.');
      if (showToast) showToast('Grievance filed directly to HR desk.', 'success');

      // Reset form
      setReportedAgainstId('');
      setCategory('NOISE_DISTURBANCE');
      setSeverity('MEDIUM');
      setSubject('');
      setDescription('');
      setIsAnonymous(false);

      fetchFeedback();
      setTimeout(() => setFormSuccess(''), 5500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReview = (fb: any) => {
    setSelectedFeedback(fb);
    setNewStatus(fb.status === 'SUBMITTED' ? 'UNDER_REVIEW' : fb.status);
    setHrNotes(fb.hr_notes || '');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;
    try {
      setUpdating(true);
      await api.feedback.update(selectedFeedback.id, {
        status: newStatus,
        hr_notes: hrNotes.trim()
      });
      if (showToast) showToast(`Grievance #${selectedFeedback.id} updated to ${newStatus}.`, 'success');
      setSelectedFeedback(null);
      fetchFeedback();
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Failed to update feedback.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const categories = [
    { value: 'NOISE_DISTURBANCE', label: 'Noise / Loud Speaking / Disruption', desc: 'e.g. Speaks too loudly on calls or disturbs nearby coworkers' },
    { value: 'INTERPERSONAL_CONFLICT', label: 'Interpersonal Conflict / Friction', desc: 'Disagreements or tension between team members' },
    { value: 'WORKPLACE_CONDUCT', label: 'Unprofessional Conduct / Etiquette', desc: 'Behavior non-compliant with office decorum' },
    { value: 'COMMUNICATION', label: 'Communication Breakdown', desc: 'Unresponsive or uncooperative collaboration' },
    { value: 'WORK_ALLOCATION', label: 'Work Allocation / Deadlines', desc: 'Uneven workload distribution or unfulfilled commitments' },
    { value: 'FACILITIES_DESK', label: 'Workstation / Seating Concern', desc: 'Physical desk location, temperature, or chair ergonomics' },
    { value: 'OTHER', label: 'Other Workplace Grievance', desc: 'Any other matter requiring HR attention' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 9px', borderRadius: '12px', fontSize: '0.73rem', fontWeight: 700 }}>SUBMITTED</span>;
      case 'UNDER_REVIEW':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 9px', borderRadius: '12px', fontSize: '0.73rem', fontWeight: 700 }}>UNDER REVIEW</span>;
      case 'ACTION_TAKEN':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: '12px', fontSize: '0.73rem', fontWeight: 700 }}>ACTION TAKEN</span>;
      case 'RESOLVED':
        return <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 9px', borderRadius: '12px', fontSize: '0.73rem', fontWeight: 700 }}>RESOLVED</span>;
      case 'DISMISSED':
        return <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 9px', borderRadius: '12px', fontSize: '0.73rem', fontWeight: 700 }}>DISMISSED</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 9px', borderRadius: '12px', fontSize: '0.73rem', fontWeight: 700 }}>{status}</span>;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>CRITICAL</span>;
      case 'HIGH':
        return <span style={{ background: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>HIGH</span>;
      case 'MEDIUM':
        return <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>MEDIUM</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>LOW</span>;
    }
  };

  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchesSearch = 
      (fb.subject && fb.subject.toLowerCase().includes(search.toLowerCase())) ||
      (fb.description && fb.description.toLowerCase().includes(search.toLowerCase())) ||
      (fb.reported_against_name && fb.reported_against_name.toLowerCase().includes(search.toLowerCase())) ||
      (fb.reporter_name && fb.reporter_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || fb.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || fb.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate HR Metrics
  const totalCount = feedbacks.length;
  const pendingCount = feedbacks.filter(f => f.status === 'SUBMITTED' || f.status === 'UNDER_REVIEW').length;
  const noiseCount = feedbacks.filter(f => f.category === 'NOISE_DISTURBANCE').length;
  const resolvedCount = feedbacks.filter(f => f.status === 'RESOLVED' || f.status === 'ACTION_TAKEN').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquareWarning size={24} color="#7c3aed" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Team Workplace Feedback & Grievance Desk
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
            Confidential reporting channel for workplace disturbances, interpersonal issues, and team atmosphere.
          </p>
        </div>

        {/* View Switcher for HR */}
        {isHR && (
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
            <button
              onClick={() => setActiveTab('HR_DESK')}
              style={{
                background: activeTab === 'HR_DESK' ? '#ffffff' : 'transparent',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: activeTab === 'HR_DESK' ? '#7c3aed' : '#64748b',
                boxShadow: activeTab === 'HR_DESK' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer'
              }}
            >
              HR Grievance Review Desk ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('NEW_REPORT')}
              style={{
                background: activeTab === 'NEW_REPORT' ? '#ffffff' : 'transparent',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: activeTab === 'NEW_REPORT' ? '#7c3aed' : '#64748b',
                boxShadow: activeTab === 'NEW_REPORT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer'
              }}
            >
              + File Feedback / Grievance
            </button>
          </div>
        )}
      </div>

      {/* HR Overview KPI Cards */}
      {isHR && activeTab === 'HR_DESK' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}>
          <div className="app-card" style={{ padding: '16px 20px', borderLeft: '4px solid #7c3aed' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Grievances Filed</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{totalCount}</div>
          </div>
          <div className="app-card" style={{ padding: '16px 20px', borderLeft: '4px solid #d97706' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Pending Review</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{pendingCount}</div>
          </div>
          <div className="app-card" style={{ padding: '16px 20px', borderLeft: '4px solid #3b82f6' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Noise & Disturbance Reports</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>{noiseCount}</div>
          </div>
          <div className="app-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Resolved / Addressed</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>{resolvedCount}</div>
          </div>
        </div>
      )}

      {/* FORM: File a Feedback / Grievance */}
      {activeTab === 'NEW_REPORT' && (
        <div className="app-card animate-fade-in" style={{ padding: '24px 28px', background: '#fff', borderRadius: '14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Volume2 size={22} color="#7c3aed" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Report a Colleague Issue or Workplace Disturbance
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '20px' }}>
            If you are experiencing disruptions (e.g. someone speaking too loudly on calls, personal conflict, or workspace discomfort), inform HR directly. Your request will be addressed with discretion.
          </p>

          {formSuccess && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#059669" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#dc2626" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Row 1: Colleague select & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Colleague In Question (Optional)
                </label>
                <select
                  value={reportedAgainstId}
                  onChange={(e) => setReportedAgainstId(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="">General Workplace / Not Specific Colleague</option>
                  {users
                    .filter(u => u.id !== currentUser?.id)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} &bull; {u.department_name || u.role} ({u.email})
                      </option>
                    ))}
                </select>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                  Select the colleague causing the disturbance (e.g. Aditi Verma) or leave blank for office-wide issues.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Issue Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                  {categories.find(c => c.value === category)?.desc}
                </span>
              </div>
            </div>

            {/* Row 2: Severity & Subject */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="LOW">Low (Mild Distraction)</option>
                  <option value="MEDIUM">Medium (Impacting Focus)</option>
                  <option value="HIGH">High (Disruptive to Work)</option>
                  <option value="CRITICAL">Critical (Urgent HR Action)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Summary Subject * (e.g. Speaks too loudly on calls disturbing nearby colleagues)
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of the issue..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Row 3: Detailed Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Detailed Description & Context *
              </label>
              <textarea
                rows={4}
                placeholder="Describe what is occurring, frequency (e.g. every afternoon), impact on your work, and any prior communication with the person..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
              />
            </div>

            {/* Confidentiality / Anonymous Checkbox */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <input
                type="checkbox"
                id="anonymousToggle"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <label htmlFor="anonymousToggle" style={{ fontSize: '0.82rem', color: '#334155', cursor: 'pointer', lineHeight: 1.4 }}>
                <strong>Submit Anonymously (Hide my identity)</strong>
                <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                  When checked, your name and email will be hidden from the HR ticket view. HR will only see the complaint description and the colleague named.
                </span>
              </label>
            </div>

            {/* Submit button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                <Send size={15} />
                <span>{submitting ? 'Submitting to HR...' : 'Submit Report to HR'}</span>
              </button>
            </div>

          </form>

        </div>
      )}

      {/* EMPLOYEE VIEW: My Submitted Grievances */}
      {!isHR && (
        <div className="app-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              My Submitted Grievances & Status
            </h4>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Total: {feedbacks.length}
            </span>
          </div>

          {feedbacks.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>
              You have not filed any workplace feedback yet. Use the form above if you experience any disturbances.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {feedbacks.map(fb => (
                <div
                  key={fb.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700 }}>
                        #{fb.id} &bull; {fb.category.replace('_', ' ')}
                      </span>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: '2px 0 0 0' }}>
                        {fb.subject}
                      </h5>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getSeverityBadge(fb.severity)}
                      {getStatusBadge(fb.status)}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#475569', margin: '4px 0 0 0' }}>
                    {fb.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                    <span>Involving: <strong>{fb.reported_against_name || 'General Environment'}</strong></span>
                    <span>Filed: {new Date(fb.created_at).toLocaleDateString()}</span>
                  </div>

                  {fb.hr_notes && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 12px', fontSize: '0.78rem', color: '#166534' }}>
                      <strong>HR Update Note:</strong> {fb.hr_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HR VIEW: Grievance Desk Table & Filter */}
      {isHR && activeTab === 'HR_DESK' && (
        <div className="app-card" style={{ padding: '20px 24px' }}>
          
          {/* Filters Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by colleague, reporter, or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '32px', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="#64748b" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="ACTION_TAKEN">ACTION TAKEN</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="DISMISSED">DISMISSED</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grievances List */}
          {loading ? (
            <p style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.85rem' }}>
              Loading grievances...
            </p>
          ) : filteredFeedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <p style={{ fontWeight: 600 }}>No grievances match the filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredFeedbacks.map(fb => (
                <div
                  key={fb.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    borderLeft: fb.severity === 'CRITICAL' ? '4px solid #ef4444' : fb.severity === 'HIGH' ? '4px solid #f97316' : '4px solid #7c3aed'
                  }}
                >
                  {/* Top Bar: IDs, Category, Status, Severity, Action button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', background: '#ede9fe', padding: '2px 7px', borderRadius: '4px' }}>
                          GRIEVANCE #{fb.id}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
                          {fb.category.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>
                        {fb.subject}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getSeverityBadge(fb.severity)}
                      {getStatusBadge(fb.status)}
                      <button
                        onClick={() => handleOpenReview(fb)}
                        style={{
                          background: '#7c3aed',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Review / Action
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                    {fb.description}
                  </p>

                  {/* Context Meta Box */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    fontSize: '0.76rem',
                    color: '#64748b',
                    gap: '10px'
                  }}>
                    <div>
                      <span>Reported By: </span>
                      {fb.is_anonymous ? (
                        <strong style={{ color: '#9333ea' }}>🔒 Anonymous / Confidential</strong>
                      ) : (
                        <strong style={{ color: '#0f172a' }}>{fb.reporter_name} ({fb.reporter_email})</strong>
                      )}
                    </div>

                    <div>
                      <span>Involving Colleague: </span>
                      <strong style={{ color: '#0f172a' }}>
                        {fb.reported_against_name ? `${fb.reported_against_name} (${fb.reported_against_department || 'General'})` : 'Workspace Environment'}
                      </strong>
                    </div>

                    <div>
                      <span>Filed: {new Date(fb.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Internal HR Notes if any */}
                  {fb.hr_notes && (
                    <div style={{
                      background: '#fefce8',
                      border: '1px solid #fef08a',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      color: '#854d0e'
                    }}>
                      <strong>HR Internal Action Log:</strong> {fb.hr_notes}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* HR Review Action Modal */}
      {selectedFeedback && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px'
        }}>
          <div className="app-card animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '28px', background: '#fff', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Review Workplace Grievance #{selectedFeedback.id}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  Involving: {selectedFeedback.reported_against_name || 'General Workplace'}
                </p>
              </div>
              <button onClick={() => setSelectedFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.82rem' }}>
              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                {selectedFeedback.subject}
              </div>
              <div style={{ color: '#475569' }}>
                {selectedFeedback.description}
              </div>
            </div>

            <form onSubmit={handleSaveReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Resolution Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="SUBMITTED">SUBMITTED (Pending Intake)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW (HR Investigating)</option>
                  <option value="ACTION_TAKEN">ACTION TAKEN (Spoke with employee / warning given)</option>
                  <option value="RESOLVED">RESOLVED (Issue resolved)</option>
                  <option value="DISMISSED">DISMISSED (Invalid or non-actionable)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Internal HR Notes & Resolution Actions Taken
                </label>
                <textarea
                  rows={4}
                  placeholder="Record private HR counseling notes, mediation actions, or seating re-arrangements (e.g. 'Met with Aditi; asked to moderate speaking volume on calls and use noise-cancelling headset')..."
                  value={hrNotes}
                  onChange={(e) => setHrNotes(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    background: '#7c3aed',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {updating ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
