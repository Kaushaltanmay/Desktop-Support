import React from 'react';
import { PlusCircle, Laptop, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface EmployeeDashboardProps {
  stats: any;
  currentUser: any;
  onOpenRaiseTicket: () => void;
  onOpenTicket: (ticketId: string | number) => void;
  onViewAllTickets: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  stats,
  currentUser,
  onOpenRaiseTicket,
  onOpenTicket,
  onViewAllTickets
}) => {
  const device = stats?.device;
  const recentTickets = stats?.recentTickets || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      
      {/* Welcome Banner with Quick Raise Button */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85, fontWeight: 700 }}>
            Employee Self-Service Desk
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '2px' }}>
            Hello, {currentUser?.name}! Need help with your workstation?
          </h2>
          <p style={{ fontSize: '0.88rem', opacity: 0.9, marginTop: '4px' }}>
            Raise an IT issue and our engineers will diagnose and resolve it promptly.
          </p>
        </div>

        <button
          id="btn-employee-raise-ticket-hero"
          onClick={onOpenRaiseTicket}
          style={{
            background: '#ffffff',
            color: '#0284c7',
            padding: '10px 22px',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          <PlusCircle size={18} />
          <span>Raise Support Ticket</span>
        </button>
      </div>

      {/* 4 Cards: My Open, Pending, Resolved, Total */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        <div className="stat-card orange">
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            MY OPEN TICKETS
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ea580c', lineHeight: 1.1, marginTop: '6px' }}>
            {stats?.stats?.openTickets ?? 0}
          </div>
        </div>

        <div className="stat-card blue">
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            PENDING TICKETS
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0284c7', lineHeight: 1.1, marginTop: '6px' }}>
            {stats?.stats?.pendingTickets ?? 0}
          </div>
        </div>

        <div className="stat-card green">
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            RESOLVED TICKETS
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', lineHeight: 1.1, marginTop: '6px' }}>
            {stats?.stats?.resolvedTickets ?? 0}
          </div>
        </div>

        <div className="stat-card purple">
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            TOTAL TICKETS
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#8b5cf6', lineHeight: 1.1, marginTop: '6px' }}>
            {stats?.stats?.totalTickets ?? 0}
          </div>
        </div>
      </div>

      {/* Grid: Recent Tickets & Assigned Device */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Recent Tickets */}
        <div className="app-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Recent Tickets
            </h3>
            <button
              onClick={onViewAllTickets}
              style={{
                background: 'transparent',
                color: '#0284c7',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {recentTickets.length === 0 ? (
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '36px 20px',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
                No support tickets raised yet.
              </p>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                If you encounter any hardware or software issue, click "Raise Support Ticket".
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentTickets.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => onOpenTicket(t.id)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                      #{t.ticket_number}
                    </span>
                    <span className={
                      t.status === 'RESOLVED' ? 'badge-resolved' :
                      t.status === 'IN PROGRESS' ? 'badge-in-progress' :
                      t.status === 'OPEN' ? 'badge-open' : 'badge-waiting'
                    }>
                      {t.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                    {t.subject}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                    <span className={
                      t.priority === 'CRITICAL' ? 'priority-critical' :
                      t.priority === 'HIGH' ? 'priority-high' :
                      t.priority === 'MEDIUM' ? 'priority-medium' : 'priority-low'
                    }>
                      {t.priority}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {new Date(t.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned System / PC Card */}
        <div className="app-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Laptop size={18} color="#0284c7" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              My Assigned Workstation
            </h3>
          </div>

          {device ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                    {device.device_name}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#e0f2fe',
                    color: '#0284c7'
                  }}>
                    Tag: {device.asset_tag}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Model: {device.manufacturer} {device.model}
                </p>
              </div>

              {/* Hardware Specs grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                fontSize: '0.8rem'
              }}>
                <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Processor</span>
                  <p style={{ fontWeight: 600, color: '#0f172a' }}>{device.cpu}</p>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Memory</span>
                  <p style={{ fontWeight: 600, color: '#0f172a' }}>{device.ram}</p>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Storage</span>
                  <p style={{ fontWeight: 600, color: '#0f172a' }}>{device.storage}</p>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Operating System</span>
                  <p style={{ fontWeight: 600, color: '#0f172a' }}>{device.operating_system}</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '30px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.85rem'
            }}>
              No system assigned to your employee ID yet. IT Support will map your asset tag soon.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
