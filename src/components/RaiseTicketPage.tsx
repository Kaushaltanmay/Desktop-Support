import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Laptop, 
  User, 
  Building2, 
  Tag, 
  ArrowRight,
  HardDrive,
  Wifi,
  Mail,
  Printer,
  Shield,
  HelpCircle
} from 'lucide-react';

interface RaiseTicketPageProps {
  currentUser: any;
  userDevice?: any;
  onTicketCreated: (ticket: any) => void;
  onCancel: () => void;
}

export const RaiseTicketPage: React.FC<RaiseTicketPageProps> = ({
  currentUser,
  userDevice,
  onTicketCreated,
  onCancel
}) => {
  const [category, setCategory] = useState('Hardware');
  const [priority, setPriority] = useState('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [deviceId, setDeviceId] = useState<number | undefined>(userDevice?.id);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ ticketNumber: string; ticket: any } | null>(null);

  const categories = [
    { name: 'Hardware', icon: Laptop },
    { name: 'Software', icon: Tag },
    { name: 'Network', icon: Wifi },
    { name: 'Internet', icon: Wifi },
    { name: 'Email', icon: Mail },
    { name: 'Printer', icon: Printer },
    { name: 'Windows', icon: HardDrive },
    { name: 'Application', icon: Tag },
    { name: 'Account/Login', icon: Shield },
    { name: 'Other', icon: HelpCircle }
  ];

  const priorities = [
    { level: 'LOW', label: 'Low', color: '#64748b', bg: '#f1f5f9' },
    { level: 'MEDIUM', label: 'Medium', color: '#0284c7', bg: '#e0f2fe' },
    { level: 'HIGH', label: 'High', color: '#ea580c', bg: '#fff7ed' },
    { level: 'CRITICAL', label: 'Critical', color: '#dc2626', bg: '#fef2f2' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both subject and description.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.tickets.create({
        category,
        priority,
        subject: subject.trim(),
        description: description.trim(),
        device_id: deviceId,
        attachment_url: attachmentUrl.trim() || null
      });

      setSuccessInfo({ ticketNumber: res.ticketNumber, ticket: res.ticket });
      onTicketCreated(res.ticket);
    } catch (err: any) {
      setError(err.message || 'Failed to raise ticket.');
    } finally {
      setLoading(false);
    }
  };

  if (successInfo) {
    return (
      <div className="app-card animate-fade-in" style={{ padding: '40px', maxWidth: '640px', margin: '20px auto', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#ecfdf5',
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <CheckCircle2 size={36} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
          Ticket Raised Successfully!
        </h2>

        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0284c7', fontFamily: 'var(--font-mono)', margin: '12px 0' }}>
          Ticket ID: #{successInfo.ticketNumber}
        </p>

        <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 24px' }}>
          An IT Engineer has been notified and will examine your ticket. You will receive real-time updates as status changes.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              setSuccessInfo(null);
              setSubject('');
              setDescription('');
            }}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Raise Another Ticket
          </button>
          <button
            onClick={onCancel}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              padding: '9px 20px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-card animate-fade-in" style={{ maxWidth: '780px', margin: '0 auto', padding: '32px' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
          Raise IT Support Ticket
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
          Submit workstation or software issues directly to Fly Media Technology IT Support.
        </p>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Auto-filled Employee Details Banner */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        fontSize: '0.82rem'
      }}>
        <div>
          <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} /> Employee Name
          </span>
          <p style={{ fontWeight: 700, color: '#0f172a' }}>{currentUser?.name}</p>
        </div>
        <div>
          <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building2 size={12} /> Department
          </span>
          <p style={{ fontWeight: 700, color: '#0f172a' }}>{currentUser?.department_name || 'General'}</p>
        </div>
        <div>
          <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Laptop size={12} /> Mapped Workstation
          </span>
          <p style={{ fontWeight: 700, color: '#0284c7' }}>
            {userDevice ? `${userDevice.asset_tag} (${userDevice.device_name})` : 'General / None'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Category Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
            Issue Category *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
            {categories.map(c => {
              const Icon = c.icon;
              const isSelected = category === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCategory(c.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? '#e0f2fe' : '#ffffff',
                    border: `1px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                    color: isSelected ? '#0284c7' : '#475569',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={14} color={isSelected ? '#0284c7' : '#94a3b8'} />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
            Urgency / Priority *
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {priorities.map(p => {
              const isSelected = priority === p.level;
              return (
                <button
                  key={p.level}
                  type="button"
                  onClick={() => setPriority(p.level)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: p.color,
                    background: isSelected ? p.bg : '#ffffff',
                    border: `2px solid ${isSelected ? p.color : '#e2e8f0'}`,
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            Issue Subject / Title *
          </label>
          <input
            id="ticket-subject-input"
            type="text"
            placeholder="e.g. Chrome not opening / HDMI screen flickering"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ width: '100%' }}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            Detailed Problem Description *
          </label>
          <textarea
            id="ticket-description-input"
            rows={4}
            placeholder="Describe what happened, any error messages displayed, and steps to reproduce..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
            required
          />
        </div>

        {/* Attachment URL / Reference */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            Screenshot / Attachment Link (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. https://drive.google.com/... or image link"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button
            id="submit-raise-ticket-btn"
            type="submit"
            disabled={loading}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Submitting...' : 'Submit Support Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};
