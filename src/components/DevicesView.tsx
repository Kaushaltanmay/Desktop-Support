import React, { useState } from 'react';
import { api } from '../services/api';
import { HardDrive, Plus, Search, User, Cpu, MemoryStick as Ram, CheckCircle2, Laptop } from 'lucide-react';

interface DevicesViewProps {
  devices: any[];
  users: any[];
  departments: any[];
  onRefresh: () => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  users,
  departments,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    asset_tag: '',
    device_name: '',
    employee_id: '',
    department_id: '',
    device_type: 'Desktop PC',
    manufacturer: 'Dell',
    model: 'OptiPlex 7000',
    serial_number: '',
    operating_system: 'Windows 11 Pro',
    ip_address: '',
    cpu: 'Intel Core i5',
    ram: '16 GB DDR4',
    storage: '512 GB SSD'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredDevices = devices.filter(d =>
    d.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
    d.device_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.employee_name && d.employee_name.toLowerCase().includes(search.toLowerCase())) ||
    d.model.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_tag || !formData.device_name) {
      setError('Asset tag and device name are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.devices.create({
        ...formData,
        employee_id: formData.employee_id ? Number(formData.employee_id) : null,
        department_id: formData.department_id ? Number(formData.department_id) : null
      });
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create device.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Systems & Device Inventory
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Managed endpoint hardware specifications, asset tags, and employee mappings.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            background: '#0284c7',
            color: '#ffffff',
            padding: '9px 18px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
          }}
        >
          <Plus size={16} />
          <span>Add Workstation</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="app-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by asset tag (e.g. SN33), employee, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px', fontSize: '0.85rem' }}
          />
        </div>
        <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: 'auto' }}>
          Total Systems: <strong style={{ color: '#0f172a' }}>{filteredDevices.length}</strong>
        </span>
      </div>

      {/* Device Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '16px'
      }}>
        {filteredDevices.map(d => (
          <div
            key={d.id}
            className="app-card"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              borderTop: '3px solid #0284c7'
            }}
          >
            {/* Header: Asset Tag & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#0284c7',
                  background: '#e0f2fe',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {d.asset_tag}
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {d.device_name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {d.manufacturer} {d.model}
                </p>
              </div>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: d.status === 'Active' ? '#ecfdf5' : '#f1f5f9',
                color: d.status === 'Active' ? '#059669' : '#64748b'
              }}>
                {d.status}
              </span>
            </div>

            {/* Assigned Employee */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ color: '#64748b' }}>Assigned Employee:</span>
              <span style={{ fontWeight: 700, color: d.employee_name ? '#0f172a' : '#94a3b8' }}>
                {d.employee_name || 'Unassigned (Pool)'}
              </span>
            </div>

            {/* Hardware Specs: CPU, RAM, Storage, OS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '0.78rem'
            }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>CPU</span>
                <p style={{ fontWeight: 600, color: '#0f172a' }}>{d.cpu}</p>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>RAM</span>
                <p style={{ fontWeight: 600, color: '#0284c7' }}>{d.ram}</p>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Storage</span>
                <p style={{ fontWeight: 600, color: '#0f172a' }}>{d.storage}</p>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Operating System</span>
                <p style={{ fontWeight: 600, color: '#0f172a' }}>{d.operating_system}</p>
              </div>
            </div>

            {/* IP Address footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', paddingTop: '6px', borderTop: '1px solid #f8fafc' }}>
              <span>IP: {d.ip_address || 'DHCP'}</span>
              <span>Serial: {d.serial_number}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Device Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px'
        }}>
          <div className="app-card animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '28px', background: '#fff', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              Add New Endpoint System
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
              Enroll a new workstation into the Fly Media Technology hardware inventory.
            </p>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Asset Tag * (e.g. SN39)
                  </label>
                  <input
                    type="text"
                    placeholder="SN39"
                    value={formData.asset_tag}
                    onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Device Name *
                  </label>
                  <input
                    type="text"
                    placeholder="DESKTOP-FIN-01"
                    value={formData.device_name}
                    onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Assign To Employee
                  </label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="">Unassigned (Inventory Pool)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Department
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    CPU
                  </label>
                  <input
                    type="text"
                    value={formData.cpu}
                    onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    RAM
                  </label>
                  <input
                    type="text"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Storage
                  </label>
                  <input
                    type="text"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: '#f1f5f9', color: '#475569', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: '#0284c7', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  Save Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
