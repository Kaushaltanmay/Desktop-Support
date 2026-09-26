import React, { useState } from 'react';
import type { RemediationTool, Machine } from '../types';
import { 
  Wrench, 
  Play, 
  Terminal, 
  Copy, 
  Check, 
  Clock, 
  RefreshCw 
} from 'lucide-react';

interface RemediationToolboxProps {
  tools: RemediationTool[];
  machines: Machine[];
}

export const RemediationToolbox: React.FC<RemediationToolboxProps> = ({
  tools,
  machines
}) => {
  const [selectedTool, setSelectedTool] = useState<RemediationTool | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', 'Network', 'System', 'Storage', 'Identity', 'Services'];

  const filteredTools = activeCategory === 'all' 
    ? tools 
    : tools.filter(t => t.category === activeCategory);

  const handleCopy = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunTool = (tool: RemediationTool) => {
    const targetMachine = machines.find(m => m.id === selectedMachineId) || machines[0];
    setSelectedTool(tool);
    setExecuting(true);
    setExecutionLogs([
      `[REMOTE AGENT] Initializing session with ${targetMachine.hostname} (${targetMachine.ip})...`,
      `[SECURITY] Authenticated via LAPS / IT-Support Kerberos Ticket.`,
      `[POWERSHELL] Executing Runbook: "${tool.name}"`,
      `> Command: ${tool.scriptCommand}`
    ]);

    setTimeout(() => {
      setExecutionLogs(prev => [...prev, `[RUNNING] Allocating process thread... processing buffers.`]);
    }, 800);

    setTimeout(() => {
      let finalSuccess = '';
      if (tool.id === 'tool-1') {
        finalSuccess = `Windows IP Configuration\nSuccessfully flushed the DNS Resolver Cache.\nWinsock catalog reset successfully.\nInterface 'Ethernet 1' renewed lease via DHCP.`;
      } else if (tool.id === 'tool-2') {
        finalSuccess = `Print Spooler service stopped.\nDeleted 4 queued printer spool jobs (.SPL/.SHD).\nPrint Spooler restarted in automatic mode. Status: RUNNING.`;
      } else if (tool.id === 'tool-3') {
        finalSuccess = `Stopped Windows Update Service.\nRenamed SoftwareDistribution to SoftwareDistribution.old.\nRestarted wuauserv. Clean cache initialized.`;
      } else if (tool.id === 'tool-4') {
        finalSuccess = `[DISM] Deployment Image Servicing and Management tool.\nImage Version: 10.0.22631.3296\n[==========================100.0%==========================]\nThe restore operation completed successfully.\n[SFC] Windows Resource Protection did not find any integrity violations.`;
      } else {
        finalSuccess = `Script completed with Exit Code: 0 (STATUS_SUCCESS).\nChanges applied to local machine registry and policy cache.`;
      }

      setExecutionLogs(prev => [
        ...prev,
        `[SUCCESS] Output received from ${targetMachine.hostname}:`,
        finalSuccess,
        `[EXECUTION FINISHED] All operations completed in ${tool.typicalDuration}.`
      ]);
      setExecuting(false);
    }, 2200);
  };

  const getDangerBadge = (danger: string) => {
    if (danger === 'safe') {
      return (
        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 600 }}>
          Safe Runbook
        </span>
      );
    }
    if (danger === 'moderate') {
      return (
        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 600 }}>
          Moderate Impact
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', fontWeight: 600 }}>
        Elevated Privileges
      </span>
    );
  };

  return (
    <div style={{ padding: '0 20px 30px' }} className="animate-fade-in">
      
      {/* Target Machine Selection Header */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(56, 189, 248, 0.15)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wrench size={20} color="#38bdf8" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
              Automated Support Runbooks
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              1-click remediation scripts to resolve common Windows & workstation desktop failures.
            </p>
          </div>
        </div>

        {/* Target Machine Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Target Endpoint:</span>
          <select
            id="runbook-target-machine-select"
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '8px 12px', minWidth: '220px' }}
          >
            {machines.map(m => (
              <option key={m.id} value={m.id}>
                {m.hostname} ({m.ip}) - {m.user}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            id={`filter-runbook-${cat.toLowerCase()}`}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: activeCategory === cat ? 600 : 500,
              background: activeCategory === cat ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
              border: `1px solid ${activeCategory === cat ? '#38bdf8' : 'var(--border-glass)'}`,
              color: activeCategory === cat ? '#38bdf8' : '#94a3b8',
              textTransform: 'capitalize'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Runbooks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '16px'
      }}>
        {filteredTools.map(tool => (
          <div
            key={tool.id}
            className="glass-panel"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {tool.category}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginTop: '6px' }}>
                  {tool.name}
                </h3>
              </div>
              {getDangerBadge(tool.dangerLevel)}
            </div>

            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {tool.description}
            </p>

            {/* Script preview */}
            <div style={{
              background: '#040711',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-glass)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#38bdf8',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tool.scriptCommand}</span>
              <button
                id={`copy-cmd-${tool.id}`}
                onClick={() => handleCopy(tool.scriptCommand, tool.id)}
                title="Copy command to clipboard"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#cbd5e1',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                {copiedId === tool.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              </button>
            </div>

            {/* Footer with run button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-glass)',
              marginTop: 'auto'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> Est. {tool.typicalDuration}
              </span>

              <button
                id={`btn-run-${tool.id}`}
                disabled={executing}
                onClick={() => handleRunTool(tool)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#fff',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: executing ? 'not-allowed' : 'pointer',
                  opacity: executing ? 0.7 : 1
                }}
              >
                <Play size={13} fill="#fff" />
                <span>Execute Runbook</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Execution Streaming Console Modal */}
      {selectedTool && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '700px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={20} color="#38bdf8" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                    Runbook Console: {selectedTool.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Target: {machines.find(m => m.id === selectedMachineId)?.hostname}
                  </p>
                </div>
              </div>

              {!executing && (
                <button
                  id="close-runbook-console-btn"
                  onClick={() => setSelectedTool(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem'
                  }}
                >
                  Close Console
                </button>
              )}
            </div>

            {/* Terminal Window */}
            <div style={{
              background: '#040711',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: '#38bdf8',
              minHeight: '220px',
              maxHeight: '340px',
              overflowY: 'auto',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {executionLogs.map((log, index) => (
                <div key={index} style={{
                  color: log.startsWith('[SUCCESS]') ? '#10b981' :
                         log.startsWith('[ERROR]') ? '#f43f5e' :
                         log.startsWith('[SECURITY]') ? '#f59e0b' : '#38bdf8'
                }}>
                  {log}
                </div>
              ))}
              {executing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontStyle: 'italic', marginTop: '8px' }}>
                  <RefreshCw size={14} className="pulse-live" />
                  <span>Execution in progress on remote host...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
