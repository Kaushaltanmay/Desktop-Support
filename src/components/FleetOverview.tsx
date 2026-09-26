import React, { useState } from 'react';
import type { Machine } from '../types';
import { 
  Laptop, 
  Cpu, 
  HardDrive, 
  Thermometer, 
  Shield, 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Wrench, 
  User, 
  FileText, 
  Zap, 
  CornerDownRight 
} from 'lucide-react';

interface FleetOverviewProps {
  machines: Machine[];
  onCreateTicketForMachine: (machine: Machine) => void;
  searchQuery: string;
}

export const FleetOverview: React.FC<FleetOverviewProps> = ({
  machines,
  onCreateTicketForMachine,
  searchQuery
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'warning' | 'critical'>('all');
  const [selectedMachineModal, setSelectedMachineModal] = useState<Machine | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);

  // Filter machines based on status and search query
  const filteredMachines = machines.filter((m) => {
    const matchesFilter = statusFilter === 'all' || m.status === statusFilter;
    const matchesSearch = 
      m.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalMachines = machines.length;
  const onlineCount = machines.filter(m => m.status === 'online').length;
  const warningCount = machines.filter(m => m.status === 'warning').length;
  const criticalCount = machines.filter(m => m.status === 'critical').length;
  const protectedPercent = Math.round((machines.filter(m => m.antivirusStatus === 'Protected').length / totalMachines) * 100);

  const getUsageColor = (val: number) => {
    if (val > 85) return '#f43f5e'; // rose
    if (val > 70) return '#f59e0b'; // amber
    return '#10b981'; // emerald
  };

  const handleRemoteAction = (machine: Machine, actionName: string) => {
    setRunningAction(actionName);
    setActionOutput(`[EXECUTING] Connecting to RPC agent on ${machine.ip} (${machine.hostname})...\n> Invoking action: ${actionName}...`);

    setTimeout(() => {
      let result = '';
      if (actionName === 'Flush DNS') {
        result = `Windows IP Configuration\n\nSuccessfully flushed the DNS Resolver Cache on ${machine.hostname}.\nReturned exit code 0.`;
      } else if (actionName === 'Restart Spooler') {
        result = `[SERVICE CONTROLLER]\nStopping service 'Print Spooler (Spoolsv)'... [OK]\nClearing C:\\Windows\\System32\\spool\\PRINTERS... [OK]\nStarting service 'Print Spooler'... [RUNNING]`;
      } else if (actionName === 'Ping Host') {
        result = `Pinging ${machine.ip} with 32 bytes of data:\nReply from ${machine.ip}: bytes=32 time=${machine.pingMs}ms TTL=128\nReply from ${machine.ip}: bytes=32 time=${machine.pingMs + 1}ms TTL=128\nPackets: Sent = 2, Received = 2, Lost = 0 (0% loss)`;
      } else if (actionName === 'Generate DxDiag') {
        result = `DxDiag 64-bit report generated successfully for ${machine.hostname}.\nDirectX Version: DirectX 12\nOS: ${machine.os}\nDisplay Driver: Clean status verified.`;
      } else {
        result = `Action '${actionName}' executed successfully on ${machine.hostname}. Exit code: 0`;
      }
      setActionOutput(result);
      setRunningAction(null);
    }, 1200);
  };

  return (
    <div style={{ padding: '0 20px 30px' }} className="animate-fade-in">
      
      {/* Telemetry Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Fleet */}
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Active Endpoints</span>
            <Laptop size={18} color="#38bdf8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>{totalMachines}</span>
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>100% Agent Enrolled</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Windows 11 / macOS / Linux Workstations
          </div>
        </div>

        {/* Online / Healthy */}
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Healthy / Online</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>{onlineCount}</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/ {totalMachines} nodes</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Latency average: 11.4 ms
          </div>
        </div>

        {/* Warning / Throttle */}
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>High Load Warnings</span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>{warningCount}</span>
            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>Exceeds 85% Threshold</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            CPU/RAM contention detected
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Offline / Critical</span>
            <XCircle size={18} color="#f43f5e" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f43f5e' }}>{criticalCount}</span>
            <span style={{ fontSize: '0.8rem', color: '#f43f5e', fontWeight: 600 }}>Immediate Attention</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            EDR Security: {protectedPercent}% Protected
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginRight: '4px' }}>Filter:</span>
          {(['all', 'online', 'warning', 'critical'] as const).map(status => (
            <button
              key={status}
              id={`filter-machine-${status}`}
              onClick={() => setStatusFilter(status)}
              style={{
                textTransform: 'capitalize',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: statusFilter === status ? 600 : 500,
                background: statusFilter === status ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${statusFilter === status ? '#38bdf8' : 'var(--border-glass)'}`,
                color: statusFilter === status ? '#38bdf8' : '#94a3b8',
                transition: 'all 0.15s ease'
              }}
            >
              {status} {status === 'all' ? `(${totalMachines})` : ''}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Showing <span style={{ color: '#fff', fontWeight: 600 }}>{filteredMachines.length}</span> endpoint systems
        </div>
      </div>

      {/* Machine Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '18px'
      }}>
        {filteredMachines.map(m => {
          const isCritical = m.status === 'critical';
          const isWarning = m.status === 'warning';

          return (
            <div
              key={m.id}
              className="glass-panel"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                borderLeft: `4px solid ${isCritical ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981'}`
              }}
            >
              {/* Header: Hostname, Status & Model */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                      {m.hostname}
                    </h3>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      background: isCritical ? 'rgba(244, 63, 94, 0.15)' : isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isCritical ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981',
                      border: `1px solid ${isCritical ? 'rgba(244, 63, 94, 0.3)' : isWarning ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                    }}>
                      {m.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                    {m.model}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {m.ip}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Ping: {m.pingMs === 999 ? 'Timeout' : `${m.pingMs}ms`}
                  </div>
                </div>
              </div>

              {/* User & Department Info */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                  <User size={15} color="#38bdf8" />
                  <span style={{ fontWeight: 600 }}>{m.user}</span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{m.department}</span>
              </div>

              {/* Hardware Telemetry Progress Meters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* CPU */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Cpu size={13} color="#94a3b8" /> CPU Load
                    </span>
                    <span style={{ fontWeight: 600, color: getUsageColor(m.cpuUsage) }}>
                      {m.cpuUsage}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${m.cpuUsage}%`,
                      height: '100%',
                      backgroundColor: getUsageColor(m.cpuUsage),
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* RAM */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={13} color="#94a3b8" /> Memory (RAM)
                    </span>
                    <span style={{ fontWeight: 600, color: getUsageColor(m.ramUsage) }}>
                      {m.ramUsage}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${m.ramUsage}%`,
                      height: '100%',
                      backgroundColor: getUsageColor(m.ramUsage),
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Disk */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HardDrive size={13} color="#94a3b8" /> Storage (C:)
                    </span>
                    <span style={{ fontWeight: 600, color: getUsageColor(m.diskUsage) }}>
                      {m.diskUsage}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${m.diskUsage}%`,
                      height: '100%',
                      backgroundColor: getUsageColor(m.diskUsage),
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Footer Specs: Temp, OS, Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-glass)',
                marginTop: 'auto'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Thermometer size={14} color={m.temperatureC > 75 ? '#f43f5e' : '#38bdf8'} />
                    <span>{m.temperatureC > 0 ? `${m.temperatureC}°C` : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={14} color={m.antivirusStatus === 'Protected' ? '#10b981' : '#f43f5e'} />
                    <span>{m.antivirusStatus}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    id={`btn-diag-${m.id}`}
                    onClick={() => setSelectedMachineModal(m)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Wrench size={12} />
                    <span>Diagnostics</span>
                  </button>
                  <button
                    id={`btn-ticket-${m.id}`}
                    onClick={() => onCreateTicketForMachine(m)}
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#fbbf24',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <FileText size={12} />
                    <span>Log Ticket</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Machine Deep Diagnostics Modal */}
      {selectedMachineModal && (
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
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Laptop size={22} color="#38bdf8" />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
                    {selectedMachineModal.hostname}
                  </h2>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: selectedMachineModal.status === 'critical' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: selectedMachineModal.status === 'critical' ? '#f43f5e' : '#34d399',
                    fontWeight: 600
                  }}>
                    {selectedMachineModal.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
                  Assigned User: <strong style={{ color: '#fff' }}>{selectedMachineModal.user}</strong> ({selectedMachineModal.department})
                </p>
              </div>

              <button
                id="close-diag-modal-btn"
                onClick={() => {
                  setSelectedMachineModal(null);
                  setActionOutput(null);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                ✕
              </button>
            </div>

            {/* System Info Table */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid var(--border-glass)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Operating System</span>
                <p style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>{selectedMachineModal.os}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Hardware Model</span>
                <p style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>{selectedMachineModal.model}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>IP Address</span>
                <p style={{ fontSize: '0.85rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{selectedMachineModal.ip}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>MAC Address</span>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{selectedMachineModal.mac}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Serial Number</span>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{selectedMachineModal.serialNumber}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>System Uptime</span>
                <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 500 }}>{selectedMachineModal.uptimeDays} days</p>
              </div>
            </div>

            {/* Remote Diagnostics & Remediation Quick Triggers */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} color="#38bdf8" /> Instant Remote Remediation Actions
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { name: 'Ping Host', label: 'Ping Latency Test' },
                  { name: 'Flush DNS', label: 'Flush DNS Resolver' },
                  { name: 'Restart Spooler', label: 'Purge & Restart Spooler' },
                  { name: 'Generate DxDiag', label: 'Export DxDiag & Specs' }
                ].map(action => (
                  <button
                    key={action.name}
                    id={`action-${action.name.toLowerCase().replace(/\s+/g, '-')}`}
                    disabled={runningAction !== null}
                    onClick={() => handleRemoteAction(selectedMachineModal, action.name)}
                    style={{
                      background: runningAction === action.name ? 'rgba(56, 189, 248, 0.4)' : 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid var(--border-glass-highlight)',
                      color: '#fff',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: runningAction && runningAction !== action.name ? 0.6 : 1
                    }}
                  >
                    {runningAction === action.name ? (
                      <RefreshCw size={14} className="pulse-live" />
                    ) : (
                      <CornerDownRight size={14} color="#38bdf8" />
                    )}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Output Console */}
            {actionOutput && (
              <div style={{
                background: '#040711',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: '#38bdf8',
                whiteSpace: 'pre-wrap',
                maxHeight: '180px',
                overflowY: 'auto'
              }}>
                {actionOutput}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                id="modal-create-ticket-btn"
                onClick={() => {
                  onCreateTicketForMachine(selectedMachineModal);
                  setSelectedMachineModal(null);
                }}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#fff',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileText size={15} />
                <span>Create Incident for {selectedMachineModal.hostname}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
