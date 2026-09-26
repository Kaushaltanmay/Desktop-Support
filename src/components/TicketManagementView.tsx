import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  User, 
  Laptop, 
  ArrowUpDown, 
  Plus, 
  CheckCircle2, 
  MessageSquare,
  Building2
} from 'lucide-react';

interface TicketManagementViewProps {
  tickets: any[];
  onOpenTicket: (ticketId: string | number) => void;
  onOpenRaiseModal: () => void;
  departments: any[];
  engineers: any[];
  filters: any;
  setFilters: React.Dispatch<React.SetStateAction<any>>;
}

export const TicketManagementView: React.FC<TicketManagementViewProps> = ({
  tickets,
  onOpenTicket,
  onOpenRaiseModal,
  departments,
  engineers,
  filters,
  setFilters
}) => {
  const updateFilter = (key: string, val: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: val }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      
      {/* Title & Quick Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Ticket Management & Triage
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            View, assign, prioritize, and manage organization support requests.
          </p>
        </div>

        <button
          onClick={onOpenRaiseModal}
          style={{
            background: '#0284c7',
            color: '#ffffff',
            padding: '9px 18px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
          }}
        >
          <Plus size={16} />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="app-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search tickets by ID, employee, subject, or asset tag..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            style={{ width: '100%', paddingLeft: '38px', fontSize: '0.88rem' }}
          />
        </div>

        {/* Dropdown Filters & Sorting */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          
          {/* Status */}
          <select
            value={filters.status || 'all'}
            onChange={(e) => updateFilter('status', e.target.value)}
            style={{ fontSize: '0.82rem', padding: '6px 10px' }}
          >
            <option value="all">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="WAITING FOR USER">Waiting for User</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority */}
          <select
            value={filters.priority || 'all'}
            onChange={(e) => updateFilter('priority', e.target.value)}
            style={{ fontSize: '0.82rem', padding: '6px 10px' }}
          >
            <option value="all">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Category */}
          <select
            value={filters.category || 'all'}
            onChange={(e) => updateFilter('category', e.target.value)}
            style={{ fontSize: '0.82rem', padding: '6px 10px' }}
          >
            <option value="all">All Categories</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Network">Network</option>
            <option value="Internet">Internet</option>
            <option value="Email">Email</option>
            <option value="Printer">Printer</option>
            <option value="Windows">Windows</option>
            <option value="Application">Application</option>
            <option value="Account/Login">Account/Login</option>
          </select>

          {/* Department */}
          <select
            value={filters.department_id || 'all'}
            onChange={(e) => updateFilter('department_id', e.target.value)}
            style={{ fontSize: '0.82rem', padding: '6px 10px' }}
          >
            <option value="all">All Departments</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Assigned Engineer */}
          <select
            value={filters.assigned_to || 'all'}
            onChange={(e) => updateFilter('assigned_to', e.target.value)}
            style={{ fontSize: '0.82rem', padding: '6px 10px' }}
          >
            <option value="all">All Engineers</option>
            <option value="unassigned">Unassigned</option>
            {engineers.map((eng: any) => (
              <option key={eng.id} value={eng.id}>{eng.name}</option>
            ))}
          </select>

          {/* Sort */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={14} color="#64748b" />
            <select
              value={filters.sort || 'newest'}
              onChange={(e) => updateFilter('sort', e.target.value)}
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Priority</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tickets.map(ticket => (
          <div
            key={ticket.id}
            onClick={() => onOpenTicket(ticket.id)}
            className="app-card"
            style={{
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {/* Top row: ID, Badges, Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                  #{ticket.ticket_number}
                </span>
                <span className={
                  ticket.status === 'RESOLVED' ? 'badge-resolved' :
                  ticket.status === 'IN PROGRESS' ? 'badge-in-progress' :
                  ticket.status === 'OPEN' ? 'badge-open' : 'badge-waiting'
                }>
                  {ticket.status}
                </span>
                <span className={
                  ticket.priority === 'CRITICAL' ? 'priority-critical' :
                  ticket.priority === 'HIGH' ? 'priority-high' :
                  ticket.priority === 'MEDIUM' ? 'priority-medium' : 'priority-low'
                }>
                  {ticket.priority}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                  {ticket.category}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} />
                  {new Date(ticket.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {ticket.comment_count > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#0284c7' }}>
                    <MessageSquare size={13} />
                    {ticket.comment_count}
                  </span>
                )}
              </div>
            </div>

            {/* Subject & Description */}
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>
                {ticket.subject}
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ticket.description}
              </p>
            </div>

            {/* Bottom Meta */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              paddingTop: '8px',
              borderTop: '1px solid #f8fafc',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
                  <User size={13} color="#0284c7" />
                  <strong>{ticket.creator_name}</strong>
                  {ticket.department_name && <span style={{ color: '#94a3b8' }}>({ticket.department_name})</span>}
                </span>

                {ticket.asset_tag && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                    <Laptop size={13} />
                    Tag: <strong style={{ color: '#0f172a' }}>{ticket.asset_tag}</strong>
                  </span>
                )}
              </div>

              <div>
                <span style={{ color: '#94a3b8' }}>
                  Assigned to: <strong style={{ color: ticket.assignee_name ? '#0f172a' : '#f97316' }}>{ticket.assignee_name || 'Unassigned'}</strong>
                </span>
              </div>
            </div>
          </div>
        ))}

        {tickets.length === 0 && (
          <div className="app-card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>No tickets match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
