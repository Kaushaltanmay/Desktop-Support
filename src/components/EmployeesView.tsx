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
  FileSpreadsheet,
  Edit3,
  KeyRound,
  Copy,
  Check,
  Eye,
  Fingerprint,
  EyeOff,
  Sparkles,
  User,
  Key
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

  // Edit Candidate Modal State
  const [userToEdit, setUserToEdit] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    designation: '',
    department_id: '',
    department_name: '',
    employee_id: ''
  });

  // Reset Password Modal State
  const [userToResetPass, setUserToResetPass] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Bulk Credentials Report Modal (After import)
  const [importedCredentials, setImportedCredentials] = useState<any[] | null>(null);
  const [copiedAllCredentials, setCopiedAllCredentials] = useState(false);
  
  // Single Add Form
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: 'Welcome@123',
    role: 'EMPLOYEE',
    department_id: departments[0]?.id || '',
    department_name: '',
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

  // Ensure strict uniqueness by user id
  const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());

  const filteredUsers = uniqueUsers.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
    (u.department_name && u.department_name.toLowerCase().includes(search.toLowerCase())) ||
    (u.asset_tag && u.asset_tag.toLowerCase().includes(search.toLowerCase())) ||
    (u.designation && u.designation.toLowerCase().includes(search.toLowerCase())) ||
    (u.employee_id && u.employee_id.toLowerCase().includes(search.toLowerCase()))
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
      const res = await api.users.create({
        ...formData,
        department_id: formData.department_id ? Number(formData.department_id) : null
      });
      setIsAddModalOpen(false);
      setSuccessMsg(`Candidate ${formData.name} added! Username: ${res.credentials?.username || formData.username || formData.email.split('@')[0]} (Password: ${formData.password}). IT notified.`);
      setTimeout(() => setSuccessMsg(''), 6000);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: any) => {
    setUserToEdit(user);
    setEditFormData({
      name: user.name || '',
      username: user.username || user.email.split('@')[0],
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'EMPLOYEE',
      designation: user.designation || '',
      department_id: user.department_id ? String(user.department_id) : '',
      department_name: '',
      employee_id: user.employee_id || ''
    });
    setError('');
  };

  // Save Edit Candidate Details
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    try {
      setLoading(true);
      setError('');
      await api.users.update(userToEdit.id, {
        ...editFormData,
        department_id: editFormData.department_id ? Number(editFormData.department_id) : null
      });
      setUserToEdit(null);
      setSuccessMsg(`Candidate ${editFormData.name} profile updated successfully.`);
      setTimeout(() => setSuccessMsg(''), 4500);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update candidate details.');
    } finally {
      setLoading(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetModal = (user: any) => {
    setUserToResetPass(user);
    setNewPasswordInput('FlyMedia@' + Math.floor(1000 + Math.random() * 9000));
    setShowPassword(false);
    setCopiedCredentials(false);
    setError('');
  };

  // Generate Random Password
  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Fly@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(pass);
  };

  // Execute Password Reset
  const handleExecutePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToResetPass || !newPasswordInput) return;

    try {
      setLoading(true);
      setError('');
      await api.users.resetPassword(userToResetPass.id, { newPassword: newPasswordInput });
      const candidateName = userToResetPass.name;
      const candidateUser = userToResetPass.username || userToResetPass.email.split('@')[0];
      setUserToResetPass(null);
      setSuccessMsg(`Password for ${candidateName} (${candidateUser}) updated to: "${newPasswordInput}". Credentials saved!`);
      setTimeout(() => setSuccessMsg(''), 8000);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
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

  // Download Genuine Excel (.xlsx) Sample Sheet with Username & Password Columns
  const handleDownloadSample = () => {
    const sampleEmployees = [
      {
        Name: 'Raman Deep',
        Username: 'raman.deep',
        Password: 'Welcome@123',
        Email: 'raman@flymedia.com',
        Department: 'UI/UX Design', // Auto-creates if new!
        Role: 'EMPLOYEE',
        Designation: 'Senior UI/UX Designer', // Auto-creates if new!
        Phone: '9876543210',
        Employee_ID: 'EMP-105'
      },
      {
        Name: 'Harpreet Kaur',
        Username: 'harpreet.k',
        Password: 'Pass#2026',
        Email: 'harpreet@flymedia.com',
        Department: 'Digital Marketing',
        Role: 'EMPLOYEE',
        Designation: 'SEO Specialist',
        Phone: '9876543211',
        Employee_ID: 'EMP-106'
      },
      {
        Name: 'Gurpreet Singh',
        Username: 'gurpreet.it',
        Password: 'Network@2026',
        Email: 'gurpreet@flymedia.com',
        Department: 'IT & Infrastructure',
        Role: 'IT_ENGINEER',
        Designation: 'Network Associate',
        Phone: '9876543212',
        Employee_ID: 'ENG-003'
      },
      {
        Name: 'Simran Sharma',
        Username: 'simran.hr',
        Password: 'SecureHR!9',
        Email: 'simran@flymedia.com',
        Department: 'Human Resources',
        Role: 'HR',
        Designation: 'Talent Acquisition Lead',
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
          const normalized: Record<string, any> = {};
          for (const key of Object.keys(row)) {
            normalized[key.trim().toLowerCase().replace(/[\s_]+/g, '')] = row[key];
          }

          const name = normalized['name'] || normalized['fullname'] || normalized['employeename'];
          const email = normalized['email'] || normalized['workemail'];
          const username = normalized['username'] || normalized['loginid'] || normalized['user'] || '';
          const password = normalized['password'] || normalized['pass'] || normalized['temppassword'] || 'Welcome@123';
          const role = normalized['role'] ? String(normalized['role']).trim() : 'EMPLOYEE';
          const dept = normalized['department'] || normalized['dept'] || '';
          const designation = normalized['designation'] || normalized['title'] || role;
          const phone = normalized['phone'] || normalized['mobile'] || '';
          const employeeId = normalized['employeeid'] || normalized['empid'] || normalized['empcode'] || '';

          if (!name || !email) continue;

          parsed.push({
            name: String(name).trim(),
            username: String(username).trim() || String(email).split('@')[0].trim(),
            password: String(password).trim() || 'Welcome@123',
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
      
      if (res.credentials && res.credentials.length > 0) {
        setImportedCredentials(res.credentials);
      }

      setSuccessMsg(res.message || `Successfully registered ${res.importedCount} employees in bulk! New departments and roles created.`);
      setTimeout(() => setSuccessMsg(''), 7000);
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
            Team & Candidate Directory
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Workforce roster, credentials, roles, departments, and IT workstation allocations.
          </p>
        </div>

        {canManageEmployees && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Download Sample Sheet */}
            <button
              onClick={handleDownloadSample}
              title="Download Excel sample template with Username, Password, Auto-Dept & Roles"
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
              <span>Sample Sheet (.xlsx)</span>
            </button>

            {/* Bulk Upload Button */}
            <button
              onClick={() => { setIsBulkModalOpen(true); setParsedEmployees([]); setBulkFile(null); setBulkError(''); }}
              title="Import multiple employees from Excel (.xlsx) with auto-department creation"
              style={{
                background: '#ecfdf5',
                color: '#16a34a',
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
              <Upload size={15} />
              <span>Bulk Excel Import</span>
            </button>

            {/* Single Add Employee */}
            <button
              onClick={() => { setIsAddModalOpen(true); setError(''); }}
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
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Plus size={16} />
              <span>Add Candidate</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Alerts */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#ef4444',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#16a34a',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: '420px' }}>
        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search by name, username, email, department, role or employee ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', paddingLeft: '36px', fontSize: '0.86rem' }}
        />
      </div>

      {/* Employee Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '16px'
      }}>
        {filteredUsers.map(user => {
          const isDeletable = canManageEmployees && user.id !== currentUser?.id && user.email !== 'admin@flymedia.com';
          const username = user.username || user.email.split('@')[0];

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
              {/* Header: Avatar, Name, Role badge & Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: user.role === 'IT_ENGINEER' ? '#e0f2fe' : user.role === 'HR' ? '#faf5ff' : user.role === 'ADMIN' ? '#fff7ed' : '#f1f5f9',
                    color: user.role === 'IT_ENGINEER' ? '#0284c7' : user.role === 'HR' ? '#8b5cf6' : user.role === 'ADMIN' ? '#ea580c' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    flexShrink: 0
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
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

                {/* Right Header: Emp Code */}
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {user.employee_id}
                </span>
              </div>

              {/* Login Username Card with Quick Copy */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.76rem',
                color: '#475569',
                background: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} color="#0284c7" />
                  <span>Login Username: <strong style={{ color: '#0f172a' }}>{username}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(username);
                    setSuccessMsg(`Copied username "${username}" to clipboard!`);
                    setTimeout(() => setSuccessMsg(''), 2500);
                  }}
                  title="Copy username"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '0.68rem',
                    fontWeight: 600
                  }}
                >
                  <Copy size={11} />
                  <span>Copy</span>
                </button>
              </div>

              {/* Contact & Department Details */}
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
                fontSize: '0.76rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Laptop size={14} color={user.asset_tag ? '#0284c7' : '#94a3b8'} />
                  {user.asset_tag ? (
                    <span style={{ color: '#0284c7', fontWeight: 600 }}>
                      {user.asset_tag} ({user.device_name || 'Assigned'})
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      No workstation allotted yet
                    </span>
                  )}
                </div>
              </div>

              {/* Biometric R307 UART Slot & Lab Door Status */}
              <div style={{
                padding: '8px 10px',
                borderRadius: '8px',
                background: user.fingerprint_slot ? '#f0f9ff' : '#f8fafc',
                border: `1px solid ${user.fingerprint_slot ? '#bae6fd' : '#e2e8f0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontSize: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Fingerprint size={14} color={user.fingerprint_slot ? '#0284c7' : '#94a3b8'} />
                  {user.fingerprint_slot ? (
                    <span style={{ color: '#0369a1', fontWeight: 700, fontFamily: 'monospace' }}>
                      UART Slot #{user.fingerprint_slot} ({user.biometric_device_id || 'DEVICE001'})
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      Biometric UART not enrolled
                    </span>
                  )}
                </div>
                {user.fingerprint_slot && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: user.lab_status === 'IN_LAB' ? '#dcfce7' : '#e2e8f0',
                    color: user.lab_status === 'IN_LAB' ? '#166534' : '#475569'
                  }}>
                    {user.lab_status === 'IN_LAB' ? '● IN LAB' : 'OUT LAB'}
                  </span>
                )}
              </div>

              {/* HR / Admin Action Toolbar: Edit, Reset Password, Delete */}
              {canManageEmployees && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  paddingTop: '8px',
                  borderTop: '1px dashed #e2e8f0'
                }}>
                  {/* Edit Candidate Details */}
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    title="Edit candidate information, role, and department"
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      color: '#0f172a',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit3 size={13} color="#0284c7" />
                    <span>Edit</span>
                  </button>

                  {/* Reset Password */}
                  <button
                    onClick={() => handleOpenResetModal(user)}
                    title="Change or reset candidate password"
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      color: '#b45309',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <KeyRound size={13} color="#d97706" />
                    <span>Reset Pass</span>
                  </button>

                  {/* Delete Employee */}
                  {isDeletable && (
                    <button
                      onClick={() => setUserToDelete(user)}
                      title="Delete employee"
                      style={{
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        padding: '5px 8px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <Users size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No candidates or employees found</p>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: Single Candidate Onboarding                           */}
      {/* ============================================================== */}
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
          <div className="app-card animate-scale-up" style={{ width: '100%', maxWidth: '540px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} color="#0284c7" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Onboard New Candidate</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Aditi Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Username (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. aditi.sharma (auto)"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Work Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. aditi@flymedia.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Initial Password *</label>
                  <input
                    type="text"
                    placeholder="e.g. Welcome@123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>System Portal Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <option value="EMPLOYEE">Employee (Self-Service)</option>
                    <option value="IT_ENGINEER">IT Support Engineer</option>
                    <option value="HR">HR Operations</option>
                    {currentUser?.role === 'ADMIN' && <option value="ADMIN">System Administrator</option>}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Job Designation / Role Title</label>
                  <input
                    type="text"
                    placeholder="e.g. UI/UX Designer or SEO Lead"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Department (Select Existing or Type New)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value, department_name: '' })}
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  >
                    <option value="">-- Choose Existing --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type NEW department..."
                    value={formData.department_name}
                    onChange={(e) => setFormData({ ...formData, department_name: e.target.value, department_id: '' })}
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>New departments are automatically created and registered!</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                  {loading ? 'Onboarding...' : 'Onboard & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: Edit Candidate Details                                */}
      {/* ============================================================== */}
      {userToEdit && (
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
          <div className="app-card animate-scale-up" style={{ width: '100%', maxWidth: '560px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={20} color="#0284c7" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Edit Candidate Details</h3>
              </div>
              <button onClick={() => setUserToEdit(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Login Username *</label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    required
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Work Email *</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    required
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Contact Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>System Portal Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <option value="EMPLOYEE">Employee (Self-Service)</option>
                    <option value="IT_ENGINEER">IT Support Engineer</option>
                    <option value="HR">HR Operations</option>
                    {currentUser?.role === 'ADMIN' && <option value="ADMIN">System Administrator</option>}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Employee Code</label>
                  <input
                    type="text"
                    value={editFormData.employee_id}
                    onChange={(e) => setEditFormData({ ...editFormData, employee_id: e.target.value })}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Job Designation / Role Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Developer or UI/UX Designer"
                  value={editFormData.designation}
                  onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>If this is a new company role, it will be automatically registered!</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Department</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={editFormData.department_id}
                    onChange={(e) => setEditFormData({ ...editFormData, department_id: e.target.value, department_name: '' })}
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  >
                    <option value="">-- Choose Existing --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type NEW department..."
                    value={editFormData.department_name}
                    onChange={(e) => setEditFormData({ ...editFormData, department_name: e.target.value, department_id: '' })}
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Typing a new department automatically creates it in the database and assigns it!</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setUserToEdit(null)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: '#0284c7', color: '#ffffff', padding: '8px 18px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: Reset / Change Password                               */}
      {/* ============================================================== */}
      {userToResetPass && (
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
          <div className="app-card animate-scale-up" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="#d97706" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Change Portal Password</h3>
              </div>
              <button onClick={() => setUserToResetPass(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Candidate:</span>
                <strong style={{ color: '#0f172a' }}>{userToResetPass.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Username:</span>
                <strong style={{ color: '#0284c7' }}>{userToResetPass.username || userToResetPass.email.split('@')[0]}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ color: '#334155' }}>{userToResetPass.email}</span>
              </div>
            </div>

            <form onSubmit={handleExecutePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>New Password *</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateRandomPassword}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Sparkles size={12} />
                    <span>Generate Strong Pass</span>
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password (min 4 chars)"
                    required
                    style={{ width: '100%', paddingRight: '40px', fontSize: '0.88rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {newPasswordInput && (
                <button
                  type="button"
                  onClick={() => {
                    const text = `Fly Media Technology Portal Credentials:\nUsername: ${userToResetPass.username || userToResetPass.email.split('@')[0]}\nPassword: ${newPasswordInput}\nLogin Portal: http://localhost:5173`;
                    navigator.clipboard.writeText(text);
                    setCopiedCredentials(true);
                    setTimeout(() => setCopiedCredentials(false), 2500);
                  }}
                  style={{
                    padding: '8px 12px',
                    background: copiedCredentials ? '#ecfdf5' : '#f0f9ff',
                    border: `1px solid ${copiedCredentials ? '#a7f3d0' : '#bae6fd'}`,
                    color: copiedCredentials ? '#059669' : '#0284c7',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {copiedCredentials ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCredentials ? 'Copied to Clipboard!' : 'Copy Credentials for Employee'}</span>
                </button>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setUserToResetPass(null)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newPasswordInput}
                  style={{ background: '#d97706', border: 'none', color: '#ffffff', padding: '8px 18px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: Bulk Import Employees via CSV/Excel                   */}
      {/* ============================================================== */}
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
          <div className="app-card animate-scale-up" style={{ width: '100%', maxWidth: '720px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={20} color="#16a34a" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Bulk Employee Onboarding (Excel)</h3>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
              Upload your Excel sheet (.xlsx, .xls) with columns <strong>Name, Username, Password, Email, Department, Role, Designation</strong>. 
              Any <strong style={{ color: '#0284c7' }}>new department</strong> or <strong style={{ color: '#8b5cf6' }}>new role</strong> detected in the spreadsheet will be automatically created!
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
                padding: '24px',
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
                {bulkFile ? bulkFile.name : 'Click to select Excel (.xlsx, .xls) File'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
                Columns: Name, Username, Password, Email, Role, Department, Designation, Phone, Employee_ID
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
                    Download Sample Sheet (.xlsx)
                  </button>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '6px 10px' }}>Name</th>
                        <th style={{ padding: '6px 10px' }}>Username</th>
                        <th style={{ padding: '6px 10px' }}>Password</th>
                        <th style={{ padding: '6px 10px' }}>Email</th>
                        <th style={{ padding: '6px 10px' }}>Department</th>
                        <th style={{ padding: '6px 10px' }}>Role / Designation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedEmployees.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.name}</td>
                          <td style={{ padding: '6px 10px', color: '#0284c7', fontWeight: 600 }}>{p.username}</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: '#475569' }}>{p.password}</td>
                          <td style={{ padding: '6px 10px', color: '#64748b' }}>{p.email}</td>
                          <td style={{ padding: '6px 10px', color: '#0284c7' }}>{p.department || 'General'}</td>
                          <td style={{ padding: '6px 10px' }}>{p.designation || p.role}</td>
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

      {/* ============================================================== */}
      {/* MODAL 5: Bulk Import Credentials Summary Report                */}
      {/* ============================================================== */}
      {importedCredentials && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div className="app-card animate-scale-up" style={{ width: '100%', maxWidth: '640px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
                <CheckCircle2 size={22} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Imported Candidate Credentials</h3>
              </div>
              <button onClick={() => setImportedCredentials(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
              Below are the newly registered candidates and their portal login credentials. Copy or distribute them to candidates so they can log in.
            </p>

            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px' }}>
              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '8px 10px' }}>Name</th>
                    <th style={{ padding: '8px 10px' }}>Username</th>
                    <th style={{ padding: '8px 10px' }}>Password</th>
                    <th style={{ padding: '8px 10px' }}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {importedCredentials.map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '6px 10px', color: '#0284c7', fontWeight: 700 }}>{c.username}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: '#0f172a' }}>{c.initialPassword}</td>
                      <td style={{ padding: '6px 10px', color: '#64748b' }}>{c.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  let text = "FLY MEDIA TECHNOLOGY - NEW EMPLOYEE PORTAL CREDENTIALS\n";
                  text += "Portal URL: http://localhost:5173\n";
                  text += "--------------------------------------------------------\n";
                  importedCredentials.forEach(c => {
                    text += `Candidate: ${c.name} | Username: ${c.username} | Password: ${c.initialPassword} | Email: ${c.email}\n`;
                  });
                  navigator.clipboard.writeText(text);
                  setCopiedAllCredentials(true);
                  setTimeout(() => setCopiedAllCredentials(false), 3000);
                }}
                style={{
                  background: copiedAllCredentials ? '#ecfdf5' : '#f0f9ff',
                  border: `1px solid ${copiedAllCredentials ? '#a7f3d0' : '#bae6fd'}`,
                  color: copiedAllCredentials ? '#059669' : '#0284c7',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {copiedAllCredentials ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedAllCredentials ? 'All Credentials Copied!' : 'Copy All Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={() => setImportedCredentials(null)}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: Delete Employee Confirmation                          */}
      {/* ============================================================== */}
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
