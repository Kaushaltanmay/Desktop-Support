import React from 'react';
import { User, Mail, Phone, Building2, Shield, Laptop, Cpu, MemoryStick as Ram, HardDrive, Calendar, CheckCircle2 } from 'lucide-react';

interface UserProfileViewProps {
  currentUser: any;
  userDevice?: any;
  departments: any[];
  userTickets: any[];
  onOpenTicket: (ticketId: string | number) => void;
  onOpenRaiseTicket: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  userDevice,
  departments,
  userTickets,
  onOpenTicket,
  onOpenRaiseTicket
}) => {
  const dept = departments.find(d => d.id === currentUser?.department_id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      {/* Page Title */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          My Employee Profile & Workstation
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Personal employment records, IT credentials, and assigned hardware configuration.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '22px' }}>
        {/* Left: Employee Profile Card */}
        <div className="app-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 700,
              boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)'
            }}>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                {currentUser?.name}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{currentUser?.email}</p>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#e0f2fe',
                  color: '#0284c7'
                }}>
                  {currentUser?.role}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#ecfdf5',
                  color: '#059669'
                }}>
                  Active
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={16} color="#64748b" />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Employee ID</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {currentUser?.employee_id || 'EMP-101'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Building2 size={16} color="#64748b" />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Department</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {dept?.name || 'Fly Media Technology Staff'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Phone size={16} color="#64748b" />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Contact Phone</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {currentUser?.phone || '+91 98765 00101'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={16} color="#64748b" />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Member Since</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {new Date(currentUser?.created_at || Date.now()).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Assigned Hardware & Recent Tickets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Workstation specs card */}
          <div className="app-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7'
                }}>
                  <Laptop size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    Assigned Hardware & Telemetry
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Asset Tag: {userDevice?.asset_tag || 'SN33'}
                  </span>
                </div>
              </div>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '12px',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0'
              }}>
                Hardware Compliant
              </span>
            </div>

            {userDevice ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>System Hostname</span>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginTop: '2px' }}>
                    {userDevice.device_name}
                  </p>
                </div>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Processor</span>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginTop: '2px' }}>
                    {userDevice.cpu}
                  </p>
                </div>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Installed Memory</span>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginTop: '2px' }}>
                    {userDevice.ram}
                  </p>
                </div>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Primary Storage</span>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginTop: '2px' }}>
                    {userDevice.storage}
                  </p>
                </div>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Operating System</span>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginTop: '2px' }}>
                    {userDevice.operating_system}
                  </p>
                </div>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Assigned IPv4 Address</span>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginTop: '2px' }}>
                    {userDevice.ip_address || '10.24.110.33'}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No physical workstation assigned. Please raise an IT ticket if you require a dedicated workstation.
              </div>
            )}
          </div>

          {/* Quick Ticket Action */}
          <div className="app-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                My Support Tickets
              </h3>
              <button
                onClick={onOpenRaiseTicket}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                Raise New Ticket
              </button>
            </div>

            {userTickets.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>You have no tickets currently logged.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {userTickets.slice(0, 4).map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenTicket(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0284c7' }}>
                        {t.ticket_number}
                      </span>
                      <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#0f172a' }}>
                        {t.subject}
                      </span>
                    </div>
                    <span className={
                      t.status === 'RESOLVED' ? 'badge-resolved' :
                      t.status === 'IN PROGRESS' ? 'badge-in-progress' : 'badge-open'
                    }>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
