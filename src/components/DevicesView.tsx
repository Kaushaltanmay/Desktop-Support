import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { 
  HardDrive, 
  Plus, 
  Search, 
  User, 
  Cpu, 
  MemoryStick as Ram, 
  CheckCircle2, 
  Laptop, 
  Trash2, 
  Download, 
  Upload, 
  X, 
  AlertTriangle, 
  FileSpreadsheet,
  Monitor
} from 'lucide-react';

interface DevicesViewProps {
  devices: any[];
  users: any[];
  departments: any[];
  currentUser?: any;
  onRefresh: () => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  users,
  departments,
  currentUser,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<any | null>(null);

  // Single Add Form
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

  // Bulk Upload State
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedDevices, setParsedDevices] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canManageDevices = !currentUser || currentUser?.role === 'ADMIN' || currentUser?.role === 'IT_ENGINEER';

  const filteredDevices = devices.filter(d =>
    d.asset_tag?.toLowerCase().includes(search.toLowerCase()) ||
    d.device_name?.toLowerCase().includes(search.toLowerCase()) ||
    (d.employee_name && d.employee_name.toLowerCase().includes(search.toLowerCase())) ||
    (d.model && d.model.toLowerCase().includes(search.toLowerCase())) ||
    (d.department_name && d.department_name.toLowerCase().includes(search.toLowerCase()))
  );

  // Single Workstation Creation
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
      setSuccessMsg(`Workstation ${formData.asset_tag} (${formData.device_name}) enrolled successfully!`);
      setTimeout(() => setSuccessMsg(''), 4500);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create device.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Workstation
  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    try {
      setLoading(true);
      await api.devices.delete(deviceToDelete.id);
      setSuccessMsg(`Workstation ${deviceToDelete.asset_tag} (${deviceToDelete.device_name}) deleted from inventory.`);
      setDeviceToDelete(null);
      setTimeout(() => setSuccessMsg(''), 4000);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete device.');
    } finally {
      setLoading(false);
    }
  };

  // Download Genuine Excel (.xlsx) Sample Sheet for Systems
  const handleDownloadSample = () => {
    const sampleSystems = [
      {
        Asset_Tag: 'SN40',
        Device_Name: 'DESKTOP-DEV-05',
        Device_Type: 'Desktop PC',
        Manufacturer: 'Dell',
        Model: 'OptiPlex 7000',
        Serial_Number: 'DELL-9821',
        Operating_System: 'Windows 11 Pro',
        CPU: 'Intel Core i7',
        RAM: '16 GB DDR4',
        Storage: '512 GB SSD',
        Department: 'Web Development',
        Status: 'Active'
      },
      {
        Asset_Tag: 'SN41',
        Device_Name: 'LAPTOP-MKT-02',
        Device_Type: 'Laptop',
        Manufacturer: 'Lenovo',
        Model: 'ThinkPad T14',
        Serial_Number: 'LEN-4412',
        Operating_System: 'Windows 11 Pro',
        CPU: 'Intel Core i5',
        RAM: '16 GB DDR4',
        Storage: '512 GB SSD',
        Department: 'Digital Marketing',
        Status: 'Active'
      },
      {
        Asset_Tag: 'SN42',
        Device_Name: 'DESKTOP-IT-01',
        Device_Type: 'Desktop PC',
        Manufacturer: 'HP',
        Model: 'EliteDesk 800',
        Serial_Number: 'HP-3321',
        Operating_System: 'Windows 11 Pro',
        CPU: 'Intel Core i7',
        RAM: '32 GB DDR4',
        Storage: '1 TB NVMe',
        Department: 'IT & Infrastructure',
        Status: 'Active'
      },
      {
        Asset_Tag: 'SN43',
        Device_Name: 'DESKTOP-HR-02',
        Device_Type: 'Desktop PC',
        Manufacturer: 'Dell',
        Model: 'Vostro 3020',
        Serial_Number: 'DELL-1120',
        Operating_System: 'Windows 11 Home',
        CPU: 'Intel Core i5',
        RAM: '16 GB DDR4',
        Storage: '512 GB SSD',
        Department: 'Human Resources',
        Status: 'Active'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleSystems);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Systems');
    XLSX.writeFile(workbook, 'FlyMedia_Systems_Sample_Template.xlsx');
  };

  // Parse Excel (.xlsx, .xls) or CSV File on upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);
    setBulkError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setBulkError('The uploaded Excel workbook contains no worksheets.');
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawRows.length === 0) {
          setBulkError('The uploaded Excel spreadsheet contains no hardware rows.');
          return;
        }

        const deptMap: Record<string, number> = {};
        departments.forEach(d => {
          deptMap[d.name.toLowerCase().trim()] = d.id;
        });

        const list: any[] = [];
        for (const row of rawRows) {
          const normalized: Record<string, any> = {};
          for (const key of Object.keys(row)) {
            normalized[key.trim().toLowerCase().replace(/[\s_]+/g, '')] = row[key];
          }

          const rawTag = normalized['assettag'] || normalized['tag'] || normalized['asset'];
          if (!rawTag) continue;

          const asset_tag = String(rawTag).trim().toUpperCase();
          const device_name = normalized['devicename'] || normalized['hostname'] || normalized['name'] || `Workstation-${asset_tag}`;
          const device_type = normalized['devicetype'] || normalized['type'] || 'Desktop PC';
          const manufacturer = normalized['manufacturer'] || normalized['brand'] || 'Dell';
          const model = normalized['model'] || 'OptiPlex 7000';
          const serial_number = normalized['serialnumber'] || normalized['serial'] || normalized['sn'] || `SN-${Math.floor(100000 + Math.random() * 900000)}`;
          const operating_system = normalized['os'] || normalized['operatingsystem'] || 'Windows 11 Pro';
          const cpu = normalized['cpu'] || normalized['processor'] || 'Intel Core i5';
          const ram = normalized['ram'] || normalized['memory'] || '16 GB DDR4';
          const storage = normalized['storage'] || normalized['disk'] || normalized['ssd'] || '512 GB SSD';
          const deptName = normalized['department'] || normalized['dept'] || '';
          const status = normalized['status'] || 'Active';

          list.push({
            asset_tag,
            device_name: String(device_name).trim(),
            device_type: String(device_type).trim(),
            manufacturer: String(manufacturer).trim(),
            model: String(model).trim(),
            serial_number: String(serial_number).trim(),
            operating_system: String(operating_system).trim(),
            cpu: String(cpu).trim(),
            ram: String(ram).trim(),
            storage: String(storage).trim(),
            department: String(deptName).trim(),
            department_id: deptMap[String(deptName).toLowerCase().trim()] || null,
            status: String(status).trim()
          });
        }

        if (list.length === 0) {
          setBulkError('No valid device rows found. Ensure the column "Asset_Tag" is present.');
          return;
        }

        setParsedDevices(list);
      } catch (err: any) {
        setBulkError('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Submit Bulk Import
  const handleBulkSubmit = async () => {
    if (parsedDevices.length === 0) return;
    try {
      setLoading(true);
      setBulkError('');
      const res = await api.devices.bulkImport(parsedDevices);
      setIsBulkModalOpen(false);
      setBulkFile(null);
      setParsedDevices([]);
      setSuccessMsg(res.message || `Successfully imported ${res.importedCount} systems!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      onRefresh();
    } catch (err: any) {
      setBulkError(err.message || 'Bulk import failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      
      {/* Success Notification Banner */}
      {successMsg && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '12px 16px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header & Bulk Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={22} color="#0284c7" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Systems & Device Inventory
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
            Managed IT endpoint hardware specifications, asset tags, departments, and employee workstation mappings.
          </p>
        </div>

        {canManageDevices && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadSample}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Download standard CSV spreadsheet format for bulk system enrolment"
            >
              <Download size={15} color="#0284c7" />
              <span>Sample Sheet</span>
            </button>

            <button
              onClick={() => setIsBulkModalOpen(true)}
              style={{
                background: '#f8fafc',
                border: '1px solid #94a3b8',
                color: '#0f172a',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Register multiple systems through Excel or CSV spreadsheet"
            >
              <FileSpreadsheet size={15} color="#059669" />
              <span>Bulk Import Systems</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              <span>Add Workstation</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="app-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '440px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by asset tag (e.g. SN33), employee, department, or model..."
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
              borderTop: '3px solid #0284c7',
              position: 'relative'
            }}
          >
            {/* Header: Asset Tag & Status + Delete button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#0284c7',
                  background: '#e0f2fe',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.5px'
                }}>
                  {d.asset_tag}
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '4px', marginBottom: '2px' }}>
                  {d.device_name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  {d.manufacturer} {d.model} • <span style={{ color: '#0284c7', fontWeight: 500 }}>{d.device_type}</span>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: d.status === 'Active' ? '#ecfdf5' : '#f1f5f9',
                  color: d.status === 'Active' ? '#059669' : '#64748b'
                }}>
                  {d.status}
                </span>

                {canManageDevices && (
                  <button
                    onClick={() => setDeviceToDelete(d)}
                    title="Delete Workstation from Inventory"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Assigned Employee & Department */}
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
                <p style={{ fontWeight: 600, color: '#0f172a', margin: '2px 0 0 0' }}>{d.cpu || 'N/A'}</p>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>RAM</span>
                <p style={{ fontWeight: 600, color: '#0284c7', margin: '2px 0 0 0' }}>{d.ram || 'N/A'}</p>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Storage</span>
                <p style={{ fontWeight: 600, color: '#0f172a', margin: '2px 0 0 0' }}>{d.storage || 'N/A'}</p>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Operating System</span>
                <p style={{ fontWeight: 600, color: '#0f172a', margin: '2px 0 0 0' }}>{d.operating_system || 'N/A'}</p>
              </div>
            </div>

            {/* Department & Serial footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
              <span>Dept: {d.department_name || 'General Pool'}</span>
              <span>Serial: {d.serial_number || 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="app-card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <p>No workstations found matching "{search}".</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deviceToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '20px'
        }}>
          <div className="app-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '24px', background: '#fff', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Confirm Deletion
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Endpoint hardware de-allocation
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to delete workstation <strong>{deviceToDelete.asset_tag}</strong> ({deviceToDelete.device_name})? Any linked tickets will be detached from this device.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeviceToDelete(null)}
                style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDeleteDevice}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {loading ? 'Deleting...' : 'Delete System'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px'
        }}>
          <div className="app-card animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '28px', background: '#fff', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Add New Endpoint System
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  Enroll a new workstation into Fly Media Technology hardware inventory.
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

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
                    onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value.toUpperCase() })}
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
                    Device Type
                  </label>
                  <select
                    value={formData.device_type}
                    onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="Desktop PC">Desktop PC</option>
                    <option value="Laptop">Laptop</option>
                    <option value="MacBook">MacBook</option>
                    <option value="Server">Server</option>
                    <option value="Workstation">Workstation</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="DELL-88391"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
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
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Saving...' : 'Save Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px'
        }}>
          <div className="app-card animate-fade-in" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', background: '#fff', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileSpreadsheet size={24} color="#059669" />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Bulk Import Workstations
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Upload standard CSV or Excel export to batch-enrol endpoint hardware.
                  </p>
                </div>
              </div>
              <button onClick={() => { setIsBulkModalOpen(false); setParsedDevices([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {bulkError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '16px' }}>
                {bulkError}
              </div>
            )}

            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#f8fafc',
                transition: 'border-color 0.2s',
                marginBottom: '16px'
              }}
            >
              <Upload size={32} color="#0284c7" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem', margin: 0 }}>
                {bulkFile ? bulkFile.name : 'Click to select or drop Excel (.xlsx, .xls) or CSV file'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', margin: 0 }}>
                Supported format: Microsoft Excel (.xlsx, .xls) or CSV containing Asset_Tag, Device_Name, Model, etc.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Preview Table */}
            {parsedDevices.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                    Ready to Enroll: {parsedDevices.length} System(s)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Format Validated
                  </span>
                </div>
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '8px 10px', color: '#64748b' }}>Asset Tag</th>
                        <th style={{ padding: '8px 10px', color: '#64748b' }}>Name</th>
                        <th style={{ padding: '8px 10px', color: '#64748b' }}>Type</th>
                        <th style={{ padding: '8px 10px', color: '#64748b' }}>Model</th>
                        <th style={{ padding: '8px 10px', color: '#64748b' }}>Department</th>
                        <th style={{ padding: '8px 10px', color: '#64748b' }}>Specs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedDevices.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0284c7' }}>{p.asset_tag}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{p.device_name}</td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{p.device_type}</td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>{p.manufacturer} {p.model}</td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>{p.department || 'Pool'}</td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{p.cpu} / {p.ram}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
              <button
                type="button"
                onClick={handleDownloadSample}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Download size={14} /> Download Sample Excel (.xlsx)
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setIsBulkModalOpen(false); setParsedDevices([]); }}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading || parsedDevices.length === 0}
                  onClick={handleBulkSubmit}
                  style={{
                    background: parsedDevices.length > 0 ? '#059669' : '#94a3b8',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: parsedDevices.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {loading ? 'Importing...' : `Confirm & Import (${parsedDevices.length} Systems)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};