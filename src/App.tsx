import { useState, useEffect } from 'react';
import { 
  INITIAL_MACHINES, 
  INITIAL_TICKETS, 
  REMEDIATION_TOOLS, 
  KNOWLEDGE_ARTICLES 
} from './data/mockData';
import type { Machine, Ticket, TicketStatus } from './types';
import { Navbar } from './components/Navbar';
import { FleetOverview } from './components/FleetOverview';
import { TicketQueue } from './components/TicketQueue';
import { RemediationToolbox } from './components/RemediationToolbox';
import { AnalyticsView } from './components/AnalyticsView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { TerminalConsole } from './components/TerminalConsole';
import { CreateTicketModal } from './components/CreateTicketModal';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [machines, setMachines] = useState<Machine[]>(INITIAL_MACHINES);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [activeTab, setActiveTab] = useState<string>('fleet');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedMachineForTicket, setSelectedMachineForTicket] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show toast notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Subtle real-time telemetry heartbeat to make the dashboard feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setMachines(prev => prev.map(m => {
        if (m.status === 'critical') return m; // keep offline kiosk intact
        const cpuDelta = (Math.random() - 0.5) * 4;
        const newCpu = Math.min(99, Math.max(8, Math.round(m.cpuUsage + cpuDelta)));
        const pingDelta = Math.round((Math.random() - 0.5) * 2);
        const newPing = Math.min(120, Math.max(3, m.pingMs + pingDelta));
        return {
          ...m,
          cpuUsage: newCpu,
          pingMs: newPing
        };
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Update ticket status
  const handleUpdateTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: newStatus };
      }
      return t;
    }));
    triggerToast(`Ticket ${ticketId} updated to status: ${newStatus.toUpperCase()}`);
  };

  // Append technician note
  const handleAddTechnicianNote = (ticketId: string, note: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const notes = t.technicianNotes ? [...t.technicianNotes, note] : [note];
        return { ...t, technicianNotes: notes };
      }
      return t;
    }));
    triggerToast(`New note logged for ticket ${ticketId}`);
  };

  // Create new ticket
  const handleCreateTicket = (newTicketData: Omit<Ticket, 'id' | 'createdAt'>) => {
    const newId = `INC-${8920 + tickets.length + 1}`;
    const newTicket: Ticket = {
      ...newTicketData,
      id: newId,
      createdAt: 'Just now'
    };
    setTickets(prev => [newTicket, ...prev]);
    triggerToast(`Incident ${newId} logged and dispatched successfully!`);
    setActiveTab('tickets');
  };

  // Log ticket for specific machine from fleet view
  const handleCreateTicketForMachine = (machine: Machine) => {
    setSelectedMachineForTicket(machine.id);
    setIsCreateModalOpen(true);
  };

  const unresolvedCount = tickets.filter(t => t.status !== 'resolved').length;
  const criticalMachineCount = machines.filter(m => m.status === 'critical').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #38bdf8',
          color: '#fff',
          padding: '12px 18px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 200,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.3)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation & Telemetry Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCreateTicket={() => {
          setSelectedMachineForTicket(undefined);
          setIsCreateModalOpen(true);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        toggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        isTerminalOpen={isTerminalOpen}
        unresolvedCount={unresolvedCount}
        criticalMachineCount={criticalMachineCount}
      />

      {/* Main Workspace View */}
      <main style={{ flex: 1 }}>
        {activeTab === 'fleet' && (
          <FleetOverview
            machines={machines}
            onCreateTicketForMachine={handleCreateTicketForMachine}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'tickets' && (
          <TicketQueue
            tickets={tickets}
            machines={machines}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onAddTechnicianNote={handleAddTechnicianNote}
            onOpenCreateModal={() => {
              setSelectedMachineForTicket(undefined);
              setIsCreateModalOpen(true);
            }}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'toolbox' && (
          <RemediationToolbox
            tools={REMEDIATION_TOOLS}
            machines={machines}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            tickets={tickets}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBaseView
            articles={KNOWLEDGE_ARTICLES}
            searchQuery={searchQuery}
          />
        )}
      </main>

      {/* Bottom Global Status Footer */}
      <footer style={{
        padding: '12px 24px',
        borderTop: '1px solid var(--border-glass)',
        background: 'rgba(5, 9, 20, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span>Desktop Support Operations Command</span>
          <span>•</span>
          <span>Gateway: 10.24.100.1 [Online]</span>
          <span>•</span>
          <span>Active Technician: Tanmay Kaushal (Lead L2)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#10b981'
          }}></span>
          <span style={{ color: '#94a3b8' }}>All Systems Operational</span>
        </div>
      </footer>

      {/* Interactive Terminal CLI Console */}
      <TerminalConsole
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTicket}
        machines={machines}
        initialMachineId={selectedMachineForTicket}
      />
    </div>
  );
}

export default App;
