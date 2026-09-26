import React, { useState } from 'react';
import { Shield, Search, Filter, Clock, User, Tag, Terminal } from 'lucide-react';

interface AuditLogsViewProps {
  auditLogs: any[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ auditLogs }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSearch = 
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.user_name && log.user_name.toLowerCase().includes(search.toLowerCase())) ||
      (log.ticket_number && log.ticket_number.toLowerCase().includes(search.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const getActionColor = (action: string) => {
    if (action.includes('RESOLVED')) return { color: '#059669', bg: '#ecfdf5' };
    if (action.includes('CREATED')) return { color: '#0284c7', bg: '#e0f2fe' };
    if (action.includes('ASSIGNED')) return { color: '#8b5cf6', bg: '#faf5ff' };
    if (action.includes('REOPENED')) return { color: '#ea580c', bg: '#fff7ed' };
    return { color: '#475569', bg: '#f1f5f9' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          System Logs & Immutable Audit Trail
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Real-time record of all ticket actions, assignments, status transitions, resolutions, and system changes.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="app-card" style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search audit trail by description, ticket #, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px', fontSize: '0.85rem' }}
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
        >
          <option value="all">All Action Types</option>
          <option value="TICKET_CREATED">Ticket Created</option>
          <option value="TICKET_ASSIGNED">Ticket Assigned</option>
          <option value="STATUS_CHANGED">Status Changed</option>
          <option value="TICKET_RESOLVED">Ticket Resolved</option>
          <option value="TICKET_REOPENED">Ticket Reopened</option>
          <option value="ENGINEER_REPLIED">Engineer Replied</option>
          <option value="USER_CREATED">User Created</option>
          <option value="SYSTEM_ADDED">System Added</option>
        </select>
      </div>

      {/* Table */}
      <div className="app-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '12px 18px' }}>Timestamp</th>
              <th style={{ padding: '12px 18px' }}>Action Type</th>
              <th style={{ padding: '12px 18px' }}>Description</th>
              <th style={{ padding: '12px 18px' }}>Actor</th>
              <th style={{ padding: '12px 18px' }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => {
              const theme = getActionColor(log.action);
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 18px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: theme.bg,
                      color: theme.color
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', color: '#0f172a', fontWeight: 500 }}>
                    {log.description}
                  </td>
                  <td style={{ padding: '12px 18px', color: '#334155', fontWeight: 600 }}>
                    {log.user_name || 'System'}
                  </td>
                  <td style={{ padding: '12px 18px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
            No audit records match the current filter.
          </div>
        )}
      </div>
    </div>
  );
};
