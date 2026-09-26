import React from 'react';
import { X, Bell, Check, Clock } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onSelectTicket: (ticketId: number | string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSelectTicket
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 1200
    }}>
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '400px',
        height: '100%',
        background: '#ffffff',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#0284c7" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Notifications
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onMarkAllRead}
              style={{ background: 'transparent', color: '#0284c7', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              style={{ background: '#f1f5f9', color: '#475569', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notification Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                onMarkRead(n.id);
                if (n.ticket_id) {
                  onSelectTicket(n.ticket_id);
                  onClose();
                }
              }}
              style={{
                background: n.is_read ? '#ffffff' : '#f0f9ff',
                border: `1px solid ${n.is_read ? '#e2e8f0' : '#bae6fd'}`,
                borderRadius: '10px',
                padding: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                  {n.title}
                </span>
                {!n.is_read && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                )}
              </div>

              <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                {n.message}
              </p>

              <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} />
                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {notifications.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px', fontSize: '0.85rem' }}>
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
