import React, { useState } from 'react';
import type { Ticket, Priority, TicketCategory, Machine } from '../types';
import { PlusCircle } from 'lucide-react';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newTicket: Omit<Ticket, 'id' | 'createdAt'>) => void;
  machines: Machine[];
  initialMachineId?: string;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  machines,
  initialMachineId
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requester, setRequester] = useState('');
  const [department, setDepartment] = useState('Core Infrastructure');
  const [priority, setPriority] = useState<Priority>('high');
  const [category, setCategory] = useState<TicketCategory>('Hardware');
  const [machineId, setMachineId] = useState(initialMachineId || machines[0]?.id || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !requester.trim()) {
      setError('Please provide a title, description, and requester name.');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      requester: requester.trim(),
      department,
      priority,
      category,
      machineId,
      status: 'open',
      assignedTo: 'Tanmay (Lead L2)',
      technicianNotes: ['Incident ticket created via Desktop Support Command Center.']
    });

    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 120,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '560px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <PlusCircle size={20} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              Log New Incident Ticket
            </h3>
          </div>

          <button
            id="close-create-ticket-modal"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
              Incident Summary / Title *
            </label>
            <input
              id="ticket-form-title"
              type="text"
              placeholder="e.g. BlueScreen WHEA_UNCORRECTABLE_ERROR after sleep wake"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%' }}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
              Symptom Details & Error Description *
            </label>
            <textarea
              id="ticket-form-description"
              rows={3}
              placeholder="Provide exact error code, steps to reproduce, or affected hardware..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
              required
            />
          </div>

          {/* Requester & Department */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Employee Name *
              </label>
              <input
                id="ticket-form-requester"
                type="text"
                placeholder="e.g. Tanmay Kaushal"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Department
              </label>
              <select
                id="ticket-form-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Core Infrastructure">Core Infrastructure</option>
                <option value="Finance & Accounting">Finance & Accounting</option>
                <option value="Hardware Engineering">Hardware Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Global Sales">Global Sales</option>
                <option value="Facilities & Security">Facilities & Security</option>
              </select>
            </div>
          </div>

          {/* Priority & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Priority Urgency
              </label>
              <select
                id="ticket-form-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                style={{ width: '100%' }}
              >
                <option value="critical">Critical (P1 - Work Stopped)</option>
                <option value="high">High (P2 - Core Impaired)</option>
                <option value="medium">Medium (P3 - Partial Impact)</option>
                <option value="low">Low (P4 - Minor / Request)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Category
              </label>
              <select
                id="ticket-form-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                style={{ width: '100%' }}
              >
                <option value="Hardware">Hardware</option>
                <option value="Network">Network</option>
                <option value="OS / Software">OS / Software</option>
                <option value="Access & Security">Access & Security</option>
                <option value="Peripherals">Peripherals</option>
              </select>
            </div>
          </div>

          {/* Associated Machine */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
              Target Endpoint System
            </label>
            <select
              id="ticket-form-machine"
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              style={{ width: '100%' }}
            >
              {machines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.hostname} ({m.ip}) - {m.model}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              id="cancel-create-ticket-btn"
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                padding: '9px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            >
              Cancel
            </button>
            <button
              id="submit-create-ticket-btn"
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                padding: '9px 20px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
              }}
            >
              Dispatch Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
