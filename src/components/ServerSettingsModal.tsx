import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Smartphone, 
  Laptop, 
  Globe 
} from 'lucide-react';
import { getApiBase, setApiBase, api, DEFAULT_LAN_API, DEFAULT_EMULATOR_API } from '../services/api';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerChanged: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  isOpen,
  onClose,
  onServerChanged
}) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentUrl(getApiBase());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async (urlToTest = currentUrl) => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.system.checkHealth(urlToTest);
      setTestResult({
        success: true,
        message: `Connected! Server is online (${res.data?.organization || 'Fly Media Technology'})`,
        latency: res.latency
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Could not reach server. Verify server is running on target IP.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setApiBase(currentUrl);
    onServerChanged();
    onClose();
  };

  const handleSelectPreset = (url: string) => {
    setCurrentUrl(url);
    handleTestConnection(url);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Server size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>API Server Connection</h3>
              <p style={{ fontSize: '0.78rem', opacity: 0.9, margin: 0 }}>Configure mobile app backend endpoint</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#ffffff',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Quick 1-Click Presets */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
              Connection Presets
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleSelectPreset(DEFAULT_LAN_API)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: currentUrl === DEFAULT_LAN_API ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: currentUrl === DEFAULT_LAN_API ? '#f0f9ff' : '#ffffff',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Wifi size={18} color="#0284c7" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Office Wi-Fi / LAN Network</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{DEFAULT_LAN_API}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '6px' }}>
                  Recommended
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(DEFAULT_EMULATOR_API)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: currentUrl === DEFAULT_EMULATOR_API ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: currentUrl === DEFAULT_EMULATOR_API ? '#f0f9ff' : '#ffffff',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Smartphone size={18} color="#8b5cf6" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Android Emulator (Loopback)</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{DEFAULT_EMULATOR_API}</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('/api')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: currentUrl === '/api' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: currentUrl === '/api' ? '#f0f9ff' : '#ffffff',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Laptop size={18} color="#059669" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Desktop Web Browser Proxy</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>/api (relative origin)</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Host Input */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
              Custom API Base URL
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="http://192.168.1.xxx:5000/api"
                style={{
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.86rem'
                }}
              />
              <button
                type="button"
                onClick={() => handleTestConnection()}
                disabled={testing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '0 14px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.84rem'
                }}
              >
                <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
                {testing ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: testResult.success ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${testResult.success ? '#a7f3d0' : '#fca5a5'}`,
              color: testResult.success ? '#065f46' : '#991b1b',
              fontSize: '0.82rem'
            }}>
              {testResult.success ? (
                <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{testResult.message}</div>
                {testResult.latency !== undefined && (
                  <div style={{ fontSize: '0.74rem', opacity: 0.85, marginTop: '2px' }}>
                    Response latency: {testResult.latency}ms
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.86rem'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
            }}
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};
