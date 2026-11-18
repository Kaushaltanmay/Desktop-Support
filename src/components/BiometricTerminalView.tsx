import React, { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  WifiOff,
  Fingerprint,
  Cpu,
  RefreshCw,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Clock,
  Monitor,
  Signal,
  Radio
} from 'lucide-react';
import { api } from '../services/api';

interface BiometricTerminalViewProps {
  users?: any[];
  currentUser?: any;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function formatUptime(totalSec: number): string {
  if (!totalSec || totalSec < 0) return '0s';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function signalColor(quality: string): string {
  switch (quality) {
    case 'Excellent': return '#10b981';
    case 'Good': return '#22c55e';
    case 'Fair': return '#f59e0b';
    case 'Weak': return '#ef4444';
    default: return '#94a3b8';
  }
}

export const BiometricTerminalView: React.FC<BiometricTerminalViewProps> = ({
  users = [],
  currentUser,
  onShowToast
}) => {
  const [statusData, setStatusData] = useState<{
    server_time: string;
    devices: any[];
    mappings: any[];
    recent_logs: any[];
    pending_commands: any[];
    lab_sessions?: any[];
    currently_in_lab?: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetched, setLastFetched] = useState<string>('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [slotInput, setSlotInput] = useState<string>('2');
  const [submitting, setSubmitting] = useState(false);

  const canManage = ['ADMIN', 'IT_ENGINEER', 'HR'].includes(currentUser?.role);

  const fetchStatus = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.biometric.getLiveStatus();
      setStatusData(data);
      setLastFetched(new Date().toLocaleTimeString());
    } catch (err: any) {
      if (!silent && onShowToast) {
        onShowToast(err.message || 'Failed to load ESP32 telemetry', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    fetchStatus(false);
  }, [fetchStatus]);

  // Live poll every 3 seconds so walking around with ESP32 updates Wi-Fi RSSI in real time
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchStatus(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchStatus]);

  const device = statusData?.devices?.[0] || null;
  const mappings = statusData?.mappings || [];
  const logs = statusData?.recent_logs || [];
  const pendingCommands = statusData?.pending_commands || [];
  const labSessions = statusData?.lab_sessions || [];
  const currentlyInLab = statusData?.currently_in_lab || [];

  const handleTriggerEnroll = async (triggerEnroll: boolean) => {
    const empId = Number(selectedEmpId);
    const slot = Number(slotInput);
    if (!empId || !slot || slot < 1 || slot > 1000) {
      onShowToast?.('Please select an employee and enter a valid slot (1–1000).', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.biometric.saveMapping({
        employee_id: empId,
        device_id: device?.device_id || 'DEVICE001',
        fingerprint_slot: slot,
        trigger_enroll: triggerEnroll
      });
      onShowToast?.(res.message, 'success');
      fetchStatus(true);
    } catch (err: any) {
      onShowToast?.(err.message || 'Failed to save mapping', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slot: number, alsoEraseSensor: boolean) => {
    try {
      const res = await api.biometric.deleteMapping(slot, alsoEraseSensor, device?.device_id || 'DEVICE001');
      onShowToast?.(res.message, 'info');
      fetchStatus(true);
    } catch (err: any) {
      onShowToast?.(err.message || 'Failed to delete mapping', 'error');
    }
  };

  const rssiBars = device?.rssi_history || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        background: '#ffffff',
        padding: '18px 22px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: device?.is_online ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #475569, #64748b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Fingerprint size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              ESP32 Biometric Terminal — Live Wi-Fi Monitor
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
              ESP32 pings every <strong>5s</strong> • Page updates every <strong>3s</strong> {lastFetched ? `• Last synced ${lastFetched}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '9px',
              border: autoRefresh ? '1px solid #10b981' : '1px solid #cbd5e1',
              background: autoRefresh ? '#ecfdf5' : '#f8fafc',
              color: autoRefresh ? '#047857' : '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Radio size={15} />
            {autoRefresh ? 'Live Auto-Sync: ON' : 'Auto-Sync: PAUSED'}
          </button>

          <button
            onClick={() => fetchStatus(false)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '9px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top Grid: Live Wi-Fi Status + Virtual OLED Screen */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '18px'
      }}>
        {/* Live Wi-Fi & Connection Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: device?.is_online ? '2px solid #10b981' : '2px solid #f87171',
          padding: '22px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {device?.is_online ? <Wifi size={24} color="#059669" /> : <WifiOff size={24} color="#dc2626" />}
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  {device?.device_id || 'DEVICE001'} • {device?.location || 'Main Office'}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {device?.name || 'Main Gate ESP32 Terminal'}
                </div>
              </div>
            </div>

            <span style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              background: device?.is_online ? '#d1fae5' : '#fee2e2',
              color: device?.is_online ? '#065f46' : '#991b1b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: device?.is_online ? '#10b981' : '#ef4444'
              }} />
              {device?.is_online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* Wi-Fi Signal Strength Bar */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '14px 16px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Signal size={16} color={signalColor(device?.signal_quality)} />
                Wi-Fi Signal: <strong style={{ color: signalColor(device?.signal_quality) }}>{device?.signal_quality || 'Offline'}</strong>
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                {device?.rssi !== null && device?.rssi !== undefined ? `${device.rssi} dBm (${device.signal_percent}%)` : 'No Signal'}
              </span>
            </div>

            <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${device?.signal_percent || 0}%`,
                height: '100%',
                background: signalColor(device?.signal_quality),
                borderRadius: '999px',
                transition: 'width 0.4s ease, background 0.4s ease'
              }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginTop: '14px',
              fontSize: '0.78rem'
            }}>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Wi-Fi Network</div>
                <div style={{ color: '#0f172a', fontWeight: 800, marginTop: '2px', wordBreak: 'break-all' }}>
                  {device?.wifi_ssid || '—'}
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>ESP32 IP Address</div>
                <div style={{ color: '#0284c7', fontWeight: 800, fontFamily: 'monospace', marginTop: '2px' }}>
                  {device?.ip_address || '—'}
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Last Heartbeat</div>
                <div style={{ color: '#0f172a', fontWeight: 800, marginTop: '2px' }}>
                  {device?.seconds_since_last_seen !== null && device?.seconds_since_last_seen !== undefined
                    ? `${device.seconds_since_last_seen}s ago (#${device.ping_count})`
                    : 'Never connected'}
                </div>
              </div>
            </div>
          </div>

          {/* Live Signal History Mini-Chart (Great when walking around!) */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
              Live Signal Walk-Test History (Last {rssiBars.length} Pings)
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '4px',
              height: '52px',
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '8px',
              border: '1px solid #e2e8f0'
            }}>
              {rssiBars.length === 0 ? (
                <div style={{ width: '100%', textAlign: 'center', fontSize: '0.76rem', color: '#94a3b8', alignSelf: 'center' }}>
                  Power on your ESP32 to watch live 5-second signal bars here...
                </div>
              ) : (
                rssiBars.map((pt: { time: string; rssi: number }, idx: number) => {
                  const pct = Math.max(12, Math.min(100, Math.round(2 * (pt.rssi + 100))));
                  const barCol = pt.rssi >= -55 ? '#10b981' : pt.rssi >= -67 ? '#22c55e' : pt.rssi >= -78 ? '#f59e0b' : '#ef4444';
                  return (
                    <div
                      key={idx}
                      title={`${pt.time}: ${pt.rssi} dBm`}
                      style={{
                        flex: 1,
                        height: `${pct}%`,
                        background: barCol,
                        borderRadius: '4px 4px 2px 2px',
                        minWidth: '8px',
                        transition: 'height 0.3s ease'
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Virtual 0.96" SSD1306 OLED Live Screen (Since physical OLED isn't soldered yet!) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Monitor size={20} color="#0284c7" />
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                Virtual OLED Mirror (Live Screen)
              </span>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
              background: device?.oled_ready ? '#dcfce7' : '#fef3c7',
              color: device?.oled_ready ? '#166534' : '#92400e'
            }}>
              {device?.oled_ready ? 'Physical OLED Connected' : 'Physical OLED Not Soldered'}
            </span>
          </div>

          {/* Realistic SSD1306 Screen Box */}
          <div style={{
            background: '#020617',
            borderRadius: '14px',
            border: '4px solid #1e3a8a',
            padding: '18px 20px',
            fontFamily: 'Consolas, "Courier New", monospace',
            boxShadow: 'inset 0 0 24px rgba(56, 189, 248, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderBottom: '1px solid #1e40af',
              paddingBottom: '8px',
              marginBottom: '14px'
            }}>
              <span style={{ color: '#fde047' }}>FLY MEDIA</span>
              <span style={{ color: device?.is_online ? '#4ade80' : '#f87171' }}>
                {device?.is_online ? `ONLINE (${device?.rssi ?? '--'}dBm)` : 'OFFLINE'}
              </span>
            </div>

            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#7dd3fc', marginBottom: '6px' }}>
              {device?.display_line1 || 'Waiting for ESP32...'}
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.02em' }}>
              {device?.display_line2 || 'OFFLINE'}
            </div>

            <div style={{
              marginTop: '14px',
              fontSize: '0.72rem',
              color: '#64748b',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>{device?.device_id || 'DEVICE001'}</span>
              <span>Uptime: {formatUptime(device?.uptime_seconds || 0)}</span>
            </div>
          </div>

          {/* Hardware Health Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px'
          }}>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>R307 Sensor</div>
              <div style={{
                fontSize: '0.84rem',
                fontWeight: 800,
                marginTop: '3px',
                color: device?.sensor_ready ? '#059669' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {device?.sensor_ready ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {device?.sensor_ready ? 'Ready (Lv.5)' : 'Not Found'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Sensor Memory</div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, marginTop: '3px', color: '#0f172a' }}>
                {device?.templates_count ?? 0} / 1,000
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Offline Queue</div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, marginTop: '3px', color: (device?.queued_events || 0) > 0 ? '#d97706' : '#059669' }}>
                {device?.queued_events ?? 0} Pending
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Remote Commands Alert (if any) */}
      {pendingCommands.length > 0 && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #3b82f6',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.85rem',
          color: '#1e40af',
          fontWeight: 600
        }}>
          <Cpu size={18} />
          <span>
            Active ESP32 Command: <strong>{pendingCommands[0].command}</strong> Slot #{pendingCommands[0].fingerprint_slot}
            {pendingCommands[0].employee_name ? ` (${pendingCommands[0].employee_name})` : ''} — Status: <strong>{pendingCommands[0].status}</strong> (ESP32 picks this up within 5 seconds!)
          </span>
        </div>
      )}

      {/* Bottom Grid: Fingerprint Slot Mappings + Live Scan Feed */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '18px'
      }}>
        {/* Fingerprint Slot Mappings & Remote Enrollment */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fingerprint size={18} color="#0284c7" />
              Employee Fingerprint Slots ({mappings.length})
            </h2>
          </div>

          {canManage && (
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center'
            }}>
              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value)}
                style={{
                  flex: '1 1 150px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  background: '#ffffff'
                }}
              >
                <option value="">Select Employee...</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.username || u.role})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                max={1000}
                value={slotInput}
                onChange={e => setSlotInput(e.target.value)}
                placeholder="Slot #"
                style={{
                  width: '82px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem'
                }}
              />

              <button
                onClick={() => handleTriggerEnroll(true)}
                disabled={submitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} />
                Enroll on ESP32
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mappings.map((m: any) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    minWidth: '58px',
                    textAlign: 'center',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    fontFamily: 'monospace'
                  }}>
                    Slot #{m.fingerprint_slot}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>{m.employee_name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{m.emp_code || m.role} • {m.email}</div>
                  </div>
                </div>

                {canManage && (
                  <button
                    onClick={() => handleDeleteSlot(m.fingerprint_slot, true)}
                    title="Delete mapping & erase from R307"
                    style={{
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Biometric Scan Feed */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#059669" />
            Live Biometric Scan Feed
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '0.84rem',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1'
              }}>
                No fingerprint scans yet. Scan a finger on your R307 to see live Punch IN / Punch OUT events appear here!
              </div>
            ) : (
              logs.map((log: any) => {
                const isOk = ['LAB_IN', 'LAB_OUT', 'PUNCH_IN', 'PUNCH_OUT', 'ENROLL_SUCCESS', 'DELETE_SUCCESS', 'CLEAR_ALL_SUCCESS'].includes(log.action);
                const isWarn = ['COOLDOWN', 'ALREADY_COMPLETED', 'ENROLL_QUEUED'].includes(log.action);
                return (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: isOk ? '#f0fdf4' : isWarn ? '#fffbeb' : '#fef2f2',
                      border: `1px solid ${isOk ? '#bbf7d0' : isWarn ? '#fde68a' : '#fecaca'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isOk ? (
                        <CheckCircle2 size={16} color="#059669" />
                      ) : isWarn ? (
                        <AlertTriangle size={16} color="#d97706" />
                      ) : (
                        <XCircle size={16} color="#dc2626" />
                      )}
                      <div>
                        <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#0f172a' }}>
                          {log.employee_name || 'Unknown Finger'} {log.fingerprint_slot ? `(Slot #${log.fingerprint_slot})` : ''}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: '#475569' }}>{log.message}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: isOk ? '#dcfce7' : isWarn ? '#fef3c7' : '#fee2e2',
                        color: isOk ? '#166534' : isWarn ? '#92400e' : '#991b1b'
                      }}>
                        {log.action}
                      </span>
                      <div style={{ fontSize: '0.69rem', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <Clock size={10} />
                        {log.created_at ? new Date(log.created_at + 'Z').toLocaleTimeString() : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Lab Door Entry / Exit Register (Strictly Separate from App GPS Attendance) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              🚪 Lab Door Entry / Exit Register (ESP32 Fingerprint Only)
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '3px 0 0' }}>
              Tracks exact Lab IN &amp; Lab OUT times via R307 UART fingerprint — 100% separate from App GPS Attendance.
            </p>
          </div>
          <span style={{
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            background: currentlyInLab.length > 0 ? '#dcfce7' : '#f1f5f9',
            color: currentlyInLab.length > 0 ? '#166534' : '#475569'
          }}>
            Currently Inside Lab: {currentlyInLab.length}
          </span>
        </div>

        {labSessions.length === 0 ? (
          <div style={{
            padding: '26px 16px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '0.84rem',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1'
          }}>
            No Lab Door entries recorded yet. Place an enrolled finger on R307 to record Lab IN / Lab OUT!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Employee</th>
                  <th style={{ padding: '10px 12px' }}>UART Slot</th>
                  <th style={{ padding: '10px 12px' }}>Lab IN Time</th>
                  <th style={{ padding: '10px 12px' }}>Lab OUT Time</th>
                  <th style={{ padding: '10px 12px' }}>Duration</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {labSessions.map((s: any) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>{s.attendance_date}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{s.employee_name}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>
                      UART Slot #{s.fingerprint_slot}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#059669' }}>
                      {s.in_time ? new Date(s.in_time).toLocaleTimeString() : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0284c7' }}>
                      {s.out_time ? new Date(s.out_time).toLocaleTimeString() : 'Still Inside'}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                      {s.out_time ? `${s.duration_minutes}m` : 'Active...'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: s.status === 'IN_LAB' ? '#dcfce7' : '#e0f2fe',
                        color: s.status === 'IN_LAB' ? '#166534' : '#0369a1'
                      }}>
                        {s.status === 'IN_LAB' ? '● IN LAB' : 'OUT LAB'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
