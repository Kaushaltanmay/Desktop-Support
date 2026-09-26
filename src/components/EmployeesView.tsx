import React, { useState } from 'react';
import { api } from '../services/api';
import { Users, Plus, Search, UserCheck, Shield, Laptop, Mail, Phone, Building2 } from 'lucide-react';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    role: 'EMPLOYEE',
    department_id: departments[0]?.id || '',
    employee_id: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.department_name && u.department_name.toLowerCase().includes(search.toLowerCase())) ||
    (u.asset_tag && u.asset_tag.toLowerCase().includes(search.toLowerCase()))
  );

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
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Team & Employee Directory
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Organization staff members, department allocations, and associated IT systems.
          </p>
        </div>

        {isAdmin && (
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
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="app-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search employees by name, email, department, or asset tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px', fontSize: '0.85rem' }}
          />
        </div>
        <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: 'auto' }}>
          Total Members: <strong style={{ color: '#0f172a' }}>{filteredUsers.length}</strong>
        </span>
      </div>

      {/* Employees Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {filteredUsers.map(user => (
          <div
            key={user.id}
            className="app-card"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: user.role === 'IT_ENGINEER' ? '#e0f2fe' : user.role === 'ADMIN' ? '#fff7ed' : '#f1f5f9',
                  color: user.role === 'IT_ENGINEER' ? '#0284c7' : user.role === 'ADMIN' ? '#ea580c' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    {user.name}
                  </h3>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: user.role === 'IT_ENGINEER' ? '#e0f2fe' : user.role === 'ADMIN' ? '#fff7ed' : '#f1f5f9',
                    color: user.role === 'IT_ENGINEER' ? '#0284c7' : user.role === 'ADMIN' ? '#ea580c' : '#475569'
                  }}>
                    {user.role}
                  </span>
                </div>
              </div>

              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                {user.employee_id}
              </span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Laptop size={13} color="#94a3b8" />
                <span>
                  Mapped Device: <strong style={{ color: user.asset_tag ? '#0284c7' : '#94a3b8' }}>{user.asset_tag || 'None'}</strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Employee Modal (Admin Flow 4!) */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px'
        }}>
          <div className="app-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '28px', background: '#fff', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              Add New Employee / User
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
              Create an account for organization members so they can log in and raise tickets.
            </p>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Malhotra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Work Email *
                </label>
                <input
                  type="email"
                  placeholder="e.g. vikram@flymedia.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="IT_ENGINEER">IT Engineer</option>
                    <option value="ADMIN">System Admin</option>
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
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Initial Password
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%' }}
                />
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
