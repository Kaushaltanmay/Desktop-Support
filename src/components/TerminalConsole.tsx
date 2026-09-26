import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Trash2 } from 'lucide-react';

interface TerminalConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandOutput {
  id: string;
  command: string;
  response: string;
  isError?: boolean;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({ isOpen, onClose }) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [outputs, setOutputs] = useState<CommandOutput[]>([
    {
      id: 'init-1',
      command: 'system-init',
      response: 'IT Desktop Support Diagnostic CLI v2.4 initialized.\nType "help" to view available diagnostics and runbooks.'
    }
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, outputs]);

  if (!isOpen) return null;

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add to history
    setHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const parts = trimmed.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    let response = '';
    let isError = false;

    switch (mainCmd) {
      case 'help':
        response = 
`Available Desktop Support Commands:
  help                 Display this command reference
  ping <target>        Simulate ICMP ping packets (e.g., ping 10.24.112.44)
  ipconfig             Display network adapter configuration
  ipconfig /all        Display detailed IP, DNS, and DHCP configuration
  flushdns             Flush DNS resolver cache
  systeminfo           Display OS architecture, BIOS version, memory and hotfixes
  sfc /scannow         Simulate Windows Resource Protection file integrity scan
  gpupdate /force      Force refresh Group Policy objects from domain controller
  get-service          Check status of critical Windows Desktop services
  whoami               Display authenticated IT technician credentials
  netstat              List active TCP socket connections
  clear / cls          Clear the terminal screen`;
        break;

      case 'clear':
      case 'cls':
        setOutputs([]);
        setInputVal('');
        return;

      case 'whoami':
        response = `corp\\tanmay.kaushal (Security Identifier: S-1-5-21-4829103-500)\nRole: Senior Desktop Support Engineer (L2 Infrastructure Lead)`;
        break;

      case 'ping':
        const target = arg || '10.24.112.1';
        response = 
`Pinging ${target} with 32 bytes of data:
Reply from ${target}: bytes=32 time=4ms TTL=128
Reply from ${target}: bytes=32 time=5ms TTL=128
Reply from ${target}: bytes=32 time=3ms TTL=128
Reply from ${target}: bytes=32 time=4ms TTL=128

Ping statistics for ${target}:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 3ms, Maximum = 5ms, Average = 4ms`;
        break;

      case 'ipconfig':
        if (arg === '/all') {
          response = 
`Windows IP Configuration:
   Host Name . . . . . . . . . . . . : ADMIN-SUPPORT-PC
   Primary Dns Suffix  . . . . . . . : corp.internal
   Node Type . . . . . . . . . . . . : Hybrid
   IP Routing Enabled. . . . . . . . : No

Ethernet adapter vEthernet (Enterprise LAN):
   Connection-specific DNS Suffix  . : corp.internal
   IPv4 Address. . . . . . . . . . . : 10.24.100.12
   Subnet Mask . . . . . . . . . . . : 255.255.254.0
   Default Gateway . . . . . . . . . : 10.24.100.1
   DHCP Server . . . . . . . . . . . : 10.24.0.2
   DNS Servers . . . . . . . . . . . : 10.24.0.10, 1.1.1.1`;
        } else {
          response = 
`Windows IP Configuration:

Ethernet adapter Local Area Connection:
   IPv4 Address. . . . . . . . . . . : 10.24.100.12
   Subnet Mask . . . . . . . . . . . : 255.255.254.0
   Default Gateway . . . . . . . . . : 10.24.100.1`;
        }
        break;

      case 'flushdns':
        response = `Windows IP Configuration\nSuccessfully flushed the DNS Resolver Cache.`;
        break;

      case 'systeminfo':
        response = 
`OS Name:                   Microsoft Windows 11 Enterprise
OS Version:                10.0.22631 N/A Build 22631.3296
System Manufacturer:       Dell Inc.
System Model:              Precision 3660 Tower
System Type:               x64-based PC
Processor(s):              1 Processor(s) Installed. [01]: Intel64 Family 6 Model 151 ~3.0 GHz
BIOS Version:              Dell Inc. 2.14.0, 1/15/2026
Total Physical Memory:     32,540 MB
Available Physical Memory: 18,920 MB
Hotfix(es):                KB5034441, KB5034123, KB5034204 (All verified)`;
        break;

      case 'sfc':
        response = 
`Beginning system scan. This process will take some time.
Beginning verification phase of system scan.
Verification 100% complete.
Windows Resource Protection did not find any integrity violations.`;
        break;

      case 'gpupdate':
        response = 
`Updating policy...
Computer Policy update has completed successfully.
User Policy update has completed successfully.
Client side extensions: All GPOs mapped (Default Domain Policy, Desktop-Security-Standard).`;
        break;

      case 'get-service':
        response = 
`Status   Name               DisplayName
------   ----               -----------
Running  Spooler            Print Spooler
Running  wuauserv           Windows Update
Running  WinDefend          Microsoft Defender Antivirus Service
Running  LanmanWorkstation  Workstation
Running  BITS               Background Intelligent Transfer Service
Stopped  DiagTrack          Connected User Experiences and Telemetry`;
        break;

      case 'netstat':
        response = 
`Active Connections:
  Proto  Local Address          Foreign Address        State
  TCP    10.24.100.12:445       10.24.0.5:microsoft-ds  ESTABLISHED
  TCP    10.24.100.12:3389      10.24.112.44:59124     ESTABLISHED
  TCP    10.24.100.12:5985      10.24.115.102:49822    ESTABLISHED (WinRM)`;
        break;

      default:
        response = `'${mainCmd}' is not recognized as an internal or external command. Type "help" for a list of available diagnostic tools.`;
        isError = true;
    }

    setOutputs(prev => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        command: trimmed,
        response,
        isError
      }
    ]);

    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setInputVal(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex >= history.length) {
          setHistoryIndex(-1);
          setInputVal('');
        } else {
          setHistoryIndex(nextIndex);
          setInputVal(history[nextIndex]);
        }
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '20px',
      width: isExpanded ? 'calc(100vw - 40px)' : '620px',
      maxWidth: 'calc(100vw - 40px)',
      height: isExpanded ? '75vh' : '380px',
      background: 'rgba(5, 9, 20, 0.94)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(56, 189, 248, 0.4)',
      borderRadius: '12px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 90,
      overflow: 'hidden',
      transition: 'height 0.2s ease, width 0.2s ease'
    }}>
      {/* Console Title Bar */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TerminalIcon size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
            DesktopSupport@PowerShell: ~
          </span>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>[Admin L2 Session]</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            id="clear-terminal-btn"
            onClick={() => setOutputs([])}
            title="Clear Console"
            style={{ background: 'transparent', color: '#94a3b8', padding: '4px', cursor: 'pointer' }}
          >
            <Trash2 size={14} />
          </button>
          <button
            id="expand-terminal-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore' : 'Maximize'}
            style={{ background: 'transparent', color: '#94a3b8', padding: '4px', cursor: 'pointer' }}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            id="close-terminal-btn"
            onClick={onClose}
            title="Close Console"
            style={{ background: 'transparent', color: '#f43f5e', padding: '4px', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div style={{
        flex: 1,
        padding: '14px',
        overflowY: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {outputs.map(out => (
          <div key={out.id}>
            <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#10b981' }}>PS C:\Support&gt;</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{out.command}</span>
            </div>
            <pre style={{
              marginTop: '4px',
              color: out.isError ? '#f43f5e' : '#38bdf8',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.4
            }}>
              {out.response}
            </pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Terminal Input Prompt */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid var(--border-glass)',
        background: 'rgba(10, 16, 30, 0.7)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-mono)'
      }}>
        <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>PS&gt;</span>
        <input
          ref={inputRef}
          id="terminal-cli-input"
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command (e.g. 'help', 'ping 10.24.112.44', 'sfc /scannow')..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            padding: 0,
            boxShadow: 'none'
          }}
        />
      </div>
    </div>
  );
};
