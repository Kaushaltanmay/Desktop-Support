import React, { useState } from 'react';
import { Building2, Users, HardDrive, CheckCircle2, ChevronRight, Search } from 'lucide-react';

interface DepartmentsViewProps {
  departments: any[];
  users: any[];
  devices: any[];
  tickets: any[];
  onSelectDepartment?: (deptId: number) => void;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  departments,
  users,
  devices,
  tickets
}) => {
  const [search, setSearch] = useState('');

  const deptStats = departments.map(d => {
    const deptUsers = users.filter(u => u.department_id === d.id);
    const deptDevices = devices.filter(dev => dev.department_id === d.id);
    const deptTickets = tickets.filter(t => t.department_id === d.id);
    const activeTickets = deptTickets.filter(t => ['OPEN', 'IN PROGRESS', 'WAITING FOR USER'].includes(t.status));

    return {
      ...d,
      userCount: deptUsers.length,
      deviceCount: deptDevices.length,
      ticketCount: deptTickets.length,
      activeTicketCount: activeTickets.length,
      users: deptUsers
    };
  });

  const filteredDepts = deptStats.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      {/* Title & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Organizational Departments
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Workstation allocation, employee roster, and IT ticket volume by department.
          </p>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '18px'
      }}>
        {filteredDepts.map(dept => (
          <div key={dept.id} className="app-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7'
                }}>
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    {dept.name}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    ID: DEPT-00{dept.id}
                  </span>
                </div>
              </div>

              {dept.activeTicketCount > 0 ? (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#fff7ed',
                  color: '#ea580c',
                  border: '1px solid #fed7aa'
                }}>
                  {dept.activeTicketCount} Open Issue{dept.activeTicketCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0'
                }}>
                  All Healthy
                </span>
              )}
            </div>

            {/* Metrics Breakdown */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Users size={12} /> Staff
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '2px' }}>
                  {dept.userCount}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <HardDrive size={12} /> Systems
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '2px' }}>
                  {dept.deviceCount}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  Total Tickets
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '2px' }}>
                  {dept.ticketCount}
                </span>
              </div>
            </div>

            {/* Members preview */}
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Key Personnel
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {dept.users.slice(0, 4).map((u: any) => (
                  <span key={u.id} style={{
                    fontSize: '0.75rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    color: '#334155'
                  }}>
                    {u.name}
                  </span>
                ))}
                {dept.users.length > 4 && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b', alignSelf: 'center' }}>
                    +{dept.users.length - 4} more
                  </span>
                )}
                {dept.users.length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    No members assigned
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
