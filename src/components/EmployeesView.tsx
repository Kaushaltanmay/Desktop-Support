import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { 
  Users, 
  Plus, 
  Search, 
  UserCheck, 
  Shield, 
  Laptop, 
  Mail, 
  Phone, 
  Building2, 
  Trash2, 
  Download, 
  Upload, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet 
} from 'lucide-react';

interface EmployeesViewProps {
  users: any[];
  departments: any[];
  currentUser: any;
  onRefresh: () => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  users,
  departments,
  currentUser,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  
  // Single Add Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    role: 'EMPLOYEE',
    department_id: departments[0]?.id || '',
    designation: '',
    employee_id: '',
    phone: ''
  });

  // Bulk Upload State
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedEmployees, setParsedEmployees] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canManageEmployees = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR';

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    (u.department_name && u.department_name.toLowerCase().includes(search.toLowerCase())) ||
    (u.asset_tag && u.asset_tag.toLowerCase().includes(search.toLowerCase())) ||
    (u.designation && u.designation.toLowerCase().includes(search.toLowerCase()))
  );

  // Single Employee Creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError('Name and email are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.users.create({
        ...formData,
        department_id: formData.department_id ? Number(formData.department_id) : null
      });
      setIsAddModalOpen(false);
      setSuccessMsg('Employee successfully added! IT team has been automatically notified for system allocation.');
      setTimeout(() => setSuccessMsg(''), 4500);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Employee
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setLoading(true);
      await api.users.delete(userToDelete.id);
      setUserToDelete(null);
      setSuccessMsg(`Employee ${userToDelete.name} has been removed.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to remove employee.');
    } finally {
      setLoading(false);
    }
  };

  // Download Genuine Excel (.xlsx) Sample Sheet
  const handleDownloadSample = () => {
    const sampleEmployees = [
      {
        Name: 'Raman Deep',
        Email: 'raman@flymedia.com',
        Role: 'EMPLOYEE',
        Department: 'Web Development',
        Designation: 'Frontend Developer',
        Phone: '9876543210',
        Employee_ID: 'EMP-105'
      },
      {
        Name: 'Harpreet Kaur',
        Email: 'harpreet@flymedia.com',
        Role: 'EMPLOYEE',
        Department: 'Digital Marketing',
        Designation: 'SEO Specialist',
        Phone: '9876543211',
        Employee_ID: 'EMP-106'
      },
      {
        Name: 'Gurpreet Singh',
        Email: 'gurpreet@flymedia.com',
        Role: 'IT_ENGINEER',
        Department: 'IT & Infrastructure',
        Designation: 'Network Associate',
        Phone: '9876543212',
        Employee_ID: 'ENG-003'
      },
      {
        Name: 'Simran Sharma',
        Email: 'simran@flymedia.com',
        Role: 'HR',
        Department: 'Human Resources',
        Designation: 'Talent Acquisition Executive',
        Phone: '9876543213',
        Employee_ID: 'EMP-107'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleEmployees);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    XLSX.writeFile(workbook, 'FlyMedia_Employees_Sample_Template.xlsx');
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
          setBulkError('The uploaded Excel file contains no data rows.');
          return;
        }

        const parsed: any[] = [];
        for (const row of rawRows) {
          // Normalize column keys regardless of case or spaces
          const normalized: Record<string, any> = {};
          for (const key of Object.keys(row)) {
            normalized[key.trim().toLowerCase().replace(/[\s_]+/g, '')] = row[key];
          }

          const name = normalized['name'] || normalized['fullname'] || normalized['employeename'];
          const email = normalized['email'] || normalized['workemail'];
          const role = normalized['role'] ? String(normalized['role']).toUpperCase() : 'EMPLOYEE';
          const dept = normalized['department'] || normalized['dept'] || '';
          const designation = normalized['designation'] || normalized['title'] || 'Staff Member';
          const phone = normalized['phone'] || normalized['mobile'] || '';
          const employeeId = normalized['employeeid'] || normalized['empid'] || normalized['empcode'] || '';

          if (!name || !email) continue;

          parsed.push({
            name: String(name).trim(),
            email: String(email).trim(),
            role: role,
            department: String(dept).trim(),
            designation: String(designation).trim(),
            phone: String(phone).trim(),
            employee_id: String(employeeId).trim()
          });
        }

        if (parsed.length === 0) {
          setBulkError('Could not find required columns ("Name" and "Email") in the uploaded spreadsheet.');
        } else {
          setParsedEmployees(parsed);
        }
      } catch (err: any) {
        setBulkError('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Submit Bulk Employees
  const handleBulkSubmit = async () => {
    if (parsedEmployees.length === 0) return;
    try {
      setLoading(true);
      setBulkError('');
      const res = await api.users.bulkImport(parsedEmployees);
      setIsBulkModalOpen(false);
      setBulkFile(null);
      setParsedEmployees([]);
      setSuccessMsg(res.message || `Successfully registered ${res.importedCount} employees in bulk! IT has been notified.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      onRefresh();
    } catch (err: any) {
      setBulkError(err.message || 'Failed to import employees.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      
      {/* Title & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Team & Employee Directory
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Workforce roster, role authorizations, and allotted IT workstations.
          </p>
        </div>

        {canManageEmployees && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Download Sample Sheet */}
            <button
              onClick={handleDownloadSample}
              title="Download sample template for bulk employee onboarding"
              style={{
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Download size={15} color="#0284c7" />
              <span>Sample Sheet</span>
            </button>

            {/* Bulk Upload Button */}
            <button
              onClick={() => {
                setBulkError('');
                setBulkFile(null);
                setParsedEmployees([]);
                setIsBulkModalOpen(true);
              }}
              style={{
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Upload size={15} color="#16a34a" />
              <span>Bulk Import</span>
            </button>

            {/* Single Add Employee */}
            <button
              onClick={() => {
                setError('');
                setIsAddModalOpen(true);
              }}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 5px rgba(2, 132, 199, 0.25)',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              <span>Add Employee</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="app-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search employees by name, email, department, or PC tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px', fontSize: '0.85rem' }}
          />
        </div>
        <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: 'auto' }}>
          Total Active Staff: <strong style={{ color: '#0f172a' }}>{filteredUsers.length}</strong>
        </span>
      </div>

      {/* Employees Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {filteredUsers.map(user => {
          const isDeletable = canManageEmployees && user.id !== currentUser?.id && user.email !== 'admin@flymedia.com';

          return (
            <div
              key={user.id}
              className="app-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: user.role === 'IT_ENGINEER' ? '#e0f2fe' : user.role === 'HR' ? '#faf5ff' : user.role === 'ADMIN' ? '#fff7ed' : '#f1f5f9',
                    color: user.role === 'IT_ENGINEER' ? '#0284c7' : user.role === 'HR' ? '#8b5cf6' : user.role === 'ADMIN' ? '#ea580c' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.92rem'
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      {user.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: user.role === 'IT_ENGINEER' ? '#e0f2fe' : user.role === 'HR' ? '#faf5ff' : user.role === 'ADMIN' ? '#fff7ed' : '#f1f5f9',
                        color: user.role === 'IT_ENGINEER' ? '#0284c7' : user.role === 'HR' ? '#8b5cf6' : user.role === 'ADMIN' ? '#ea580c' : '#475569'
                      }}>
                        {user.role}
                      </span>
                      {user.designation && (
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          • {user.designation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {user.employee_id}
                  </span>
                  {isDeletable && (
                    <button
                      onClick={() => setUserToDelete(user)}
                      title="Delete employee"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        padding: '4px',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} color="#94a3b8" />
                  <span style={{ color: '#334155' }}>{user.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={13} color="#94a3b8" />
                  <span>{user.department_name || 'General Operations'}</span>
                </div>
                {user.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} color="#94a3b8" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              {/* Allotted IT Workstation */}
              <div style={{
                marginTop: 'auto',
                paddingTop: '10px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem'
              }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Laptop size={13} />
                  Workstation:
                </span>
                {user.asset_tag ? (
                  <span style={{
                    fontWeight: 700,
                    color: '#0284c7',
                    background: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {user.asset_tag} ({user.device_name || 'System'})
                  </span>
                ) : (
                  <span style={{
                    color: '#f59e0b',
                    background: '#fffbeb',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    Pending Allocation
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Single Add Employee */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="app-card animate-scale-up" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#0284c7" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Onboard New Employee</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditi Verma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="aditi@flymedia.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="IT_ENGINEER">IT Engineer</option>
                    <option value="HR">HR Lead / Staff</option>
                    {currentUser?.role === 'ADMIN' && <option value="ADMIN">System Administrator</option>}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <option value="">None / General</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. SEO Specialist"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Employee Code</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-9371 (auto)"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: '#0284c7', color: '#ffffff', padding: '8px 18px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Onboarding...' : 'Onboard & Notify IT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Import Employees via CSV/Excel */}
      {isBulkModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="app-card animate-scale-up" style={{ width: '100%', maxWidth: '640px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={20} color="#16a34a" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Bulk Employee Onboarding (CSV)</h3>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
              Upload your Excel (.xlsx, .xls) or CSV spreadsheet containing multiple team members. The system will register their accounts, configure leave quotas, and alert IT to allocate workstations.
            </p>

            {bulkError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '14px' }}>
                {bulkError}
              </div>
            )}

            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '26px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Upload size={28} color="#0284c7" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155' }}>
                {bulkFile ? bulkFile.name : 'Click to select Excel (.xlsx, .xls) or CSV File'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
                Supported format: Microsoft Excel (.xlsx, .xls) or CSV (Name, Email, Role, Department, Designation, Phone, Employee_ID)
              </div>
            </div>

            {/* Preview Parsed Rows */}
            {parsedEmployees.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                    Preview: {parsedEmployees.length} employee(s) ready to import
                  </span>
                  <button
                    onClick={handleDownloadSample}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Download Sample Sheet
                  </button>
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <tr>
                        <th style={{ padding: '6px 10px' }}>Name</th>
                        <th style={{ padding: '6px 10px' }}>Email</th>
                        <th style={{ padding: '6px 10px' }}>Role</th>
                        <th style={{ padding: '6px 10px' }}>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedEmployees.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.name}</td>
                          <td style={{ padding: '6px 10px', color: '#64748b' }}>{p.email}</td>
                          <td style={{ padding: '6px 10px' }}>{p.role}</td>
                          <td style={{ padding: '6px 10px', color: '#64748b' }}>{p.department || 'General'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleDownloadSample}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Need format? Get Sample Excel (.xlsx)
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading || parsedEmployees.length === 0}
                  onClick={handleBulkSubmit}
                  style={{
                    background: parsedEmployees.length > 0 ? '#16a34a' : '#94a3b8',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: parsedEmployees.length > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  {loading ? 'Importing...' : `Confirm & Import ${parsedEmployees.length} Staff`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Employee Confirmation */}
      {userToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="app-card animate-scale-up" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Delete Employee?</h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: '18px' }}>
              Are you sure you want to remove <strong>{userToDelete.name}</strong> ({userToDelete.email})? 
              Their system allocation will be released back to IT inventory.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDeleteUser}
                style={{ background: '#ef4444', border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
