import React, { useState } from 'react';
import type { Ticket, Priority, TicketStatus, Machine } from '../types';
import { 
  TicketCheck, 
  Clock, 
  User, 
  MessageSquare, 
  Plus, 
  Send, 
  Laptop 
} from 'lucide-react';

interface TicketQueueProps {
  tickets: Ticket[];
  machines: Machine[];
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onAddTechnicianNote: (ticketId: string, note: string) => void;
  onOpenCreateModal: () => void;
  searchQuery: string;
}

export const TicketQueue: React.FC<TicketQueueProps> = ({
  tickets,
  machines,
  onUpdateTicketStatus,
  onAddTechnicianNote,
  onOpenCreateModal,
  searchQuery
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTicketDrawer, setActiveTicketDrawer] = useState<Ticket | null>(null);
  const [newNoteText, setNewNoteText] = useState<string>('');

  const filteredTickets = tickets.filter(t => {
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesSearch = 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesStatus && matchesCategory && matchesSearch;
  });

  const getPriorityBadge = (p: Priority) => {
    const configs = {
      critical: { bg: 'rgba(244, 63, 94, 0.15)', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' },
      high: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
      medium: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' },
      low: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' }
    };
    const c = configs[p] || configs.low;
    return (
      <span style={{
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: '0.04em',
        padding: '2px 8px',
        borderRadius: '6px',
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`
      }}>
        {p}
      </span>
    );
  };

  const getStatusBadge = (s: TicketStatus) => {
    const configs = {
      open: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', label: 'Open' },
      in_progress: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', label: 'In Progress' },
      resolved: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', label: 'Resolved' },
      waiting_vendor: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', label: 'Waiting Vendor' }
    };
    const c = configs[s] || configs.open;
    return (
      <span style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: '20px',
        background: c.bg,
        color: c.text
      }}>
        {c.label}
      </span>
    );
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketDrawer || !newNoteText.trim()) return;
    onAddTechnicianNote(activeTicketDrawer.id, newNoteText.trim());
    
    // Update local drawer state as well
    const updatedNotes = [...(activeTicketDrawer.technicianNotes || []), newNoteText.trim()];
    setActiveTicketDrawer({ ...activeTicketDrawer, technicianNotes: updatedNotes });
    setNewNoteText('');
  };

  return (
    <div style={{ padding: '0 20px 30px' }} className="animate-fade-in">
      
      {/* Top Filter Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Status:</span>
            <select
              id="filter-ticket-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="waiting_vendor">Waiting Vendor</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Priority:</span>
            <select
              id="filter-ticket-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Category:</span>
            <select
              id="filter-ticket-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
            >
              <option value="all">All Categories</option>
              <option value="Hardware">Hardware</option>
              <option value="Network">Network</option>
              <option value="OS / Software">OS / Software</option>
              <option value="Access & Security">Access & Security</option>
              <option value="Peripherals">Peripherals</option>
            </select>
          </div>
        </div>

        <button
          id="btn-create-ticket-queue"
          onClick={onOpenCreateModal}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 10px rgba(2, 132, 199, 0.3)'
          }}
        >
          <Plus size={16} />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Ticket Cards Grid / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredTickets.map(ticket => {
          const machine = machines.find(m => m.id === ticket.machineId);

          return (
            <div
              key={ticket.id}
              className="glass-panel"
              style={{
                padding: '18px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderLeft: `4px solid ${
                  ticket.priority === 'critical' ? '#f43f5e' :
                  ticket.priority === 'high' ? '#f59e0b' : '#38bdf8'
                }`,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, border-color 0.15s ease'
              }}
              onClick={() => setActiveTicketDrawer(ticket)}
            >
              {/* Row 1: ID, Priority, Category, Status, CreatedAt */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {ticket.id}
                  </span>
                  {getPriorityBadge(ticket.priority)}
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    {ticket.category}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    <span>{ticket.createdAt}</span>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
              </div>

              {/* Row 2: Title & Description */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                  {ticket.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  {ticket.description}
                </p>
              </div>

              {/* Row 3: Meta & Quick Status Changer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-glass)',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#cbd5e1' }}>
                    <User size={14} color="#38bdf8" />
                    <strong>{ticket.requester}</strong> ({ticket.department})
                  </span>

                  {machine && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      <Laptop size={14} />
                      {machine.hostname} ({machine.ip})
                    </span>
                  )}

                  <span style={{ color: '#94a3b8' }}>
                    Assigned: <strong style={{ color: '#fff' }}>{ticket.assignedTo}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Change Status:</span>
                  <select
                    id={`select-status-${ticket.id}`}
                    value={ticket.status}
                    onChange={(e) => onUpdateTicketStatus(ticket.id, e.target.value as TicketStatus)}
                    style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px' }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_vendor">Waiting Vendor</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTickets.length === 0 && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <TicketCheck size={36} color="#38bdf8" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '6px' }}>No Incidents Found</h4>
            <p style={{ fontSize: '0.85rem' }}>No tickets match the current search and filter criteria.</p>
          </div>
        )}
      </div>

      {/* Ticket Detail Drawer / Modal */}
      {activeTicketDrawer && (
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
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {activeTicketDrawer.id}
                  </span>
                  {getPriorityBadge(activeTicketDrawer.priority)}
                  {getStatusBadge(activeTicketDrawer.status)}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                  {activeTicketDrawer.title}
                </h2>
              </div>

              <button
                id="close-ticket-drawer-btn"
                onClick={() => setActiveTicketDrawer(null)}
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

            {/* Description */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)',
              fontSize: '0.9rem',
              color: '#cbd5e1'
            }}>
              {activeTicketDrawer.description}
            </div>

            {/* Requester & Device info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              fontSize: '0.85rem'
            }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Requester:</span>
                <p style={{ fontWeight: 600, color: '#fff' }}>{activeTicketDrawer.requester}</p>
                <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{activeTicketDrawer.department}</p>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Assigned Lead:</span>
                <p style={{ fontWeight: 600, color: '#38bdf8' }}>{activeTicketDrawer.assignedTo}</p>
                <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Logged: {activeTicketDrawer.createdAt}</p>
              </div>
            </div>

            {/* Technician Notes Timeline */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} color="#38bdf8" /> Technician Work Log & Diagnostic Notes
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {(activeTicketDrawer.technicianNotes && activeTicketDrawer.technicianNotes.length > 0) ? (
                  activeTicketDrawer.technicianNotes.map((note, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(30, 41, 59, 0.4)',
                        borderLeft: '3px solid #38bdf8',
                        padding: '10px 14px',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.85rem',
                        color: '#cbd5e1'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '3px' }}>
                        Note #{idx + 1} • Desktop Support Team
                      </div>
                      {note}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No notes logged yet.</p>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="new-technician-note-input"
                  type="text"
                  placeholder="Append triage note, troubleshooting step, or part ordered..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  style={{ flex: 1, fontSize: '0.85rem' }}
                />
                <button
                  id="submit-technician-note-btn"
                  type="submit"
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    padding: '0 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <Send size={14} />
                  <span>Log Note</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
