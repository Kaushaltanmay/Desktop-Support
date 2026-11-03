import React, { useState } from 'react';
import { api } from '../services/api';
import { LogIn, Shield, User, Wrench, AlertCircle, Sparkles, Users } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (loginEmail?: string, loginPass?: string) => {
    const targetEmail = loginEmail || email;
    const targetPassword = loginPass || password;

    if (!targetEmail || !targetPassword) {
      setError('Please provide your username/email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.auth.login({ email: targetEmail, password: targetPassword });
      localStorage.setItem('desktop_support_token', res.token);
      localStorage.setItem('desktop_support_user', JSON.stringify(res.user));
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: 'IT Engineer (Lead)',
      name: 'Tanmay Kaushal',
      email: 'tanmay@flymedia.com',
      icon: Wrench,
      color: '#0284c7',
      bg: '#e0f2fe'
    },
    {
      role: 'Employee (Digital Marketing)',
      name: 'Sarvesh Kumar (SN33)',
      email: 'sarvesh@flymedia.com',
      icon: User,
      color: '#8b5cf6',
      bg: '#faf5ff'
    },
    {
      role: 'Employee (Web Development)',
      name: 'Manmohan Singh (SN29)',
      email: 'manmohan@flymedia.com',
      icon: User,
      color: '#10b981',
      bg: '#ecfdf5'
    },
    {
      role: 'HR Lead (Operations)',
      name: 'Simran Kaur',
      email: 'hr@flymedia.com',
      icon: Users,
      color: '#ec4899',
      bg: '#fdf2f8'
    },
    {
      role: 'System Administrator',
      name: 'Admin',
      email: 'admin@flymedia.com',
      icon: Shield,
      color: '#f97316',
      bg: '#fff7ed'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="app-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '32px 36px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header with authentic Fly Media Technology logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/flymedia_logo.png"
            alt="Fly Media Technology"
            style={{ height: '48px', objectFit: 'contain', margin: '0 auto 8px' }}
          />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
            Desktop IT Support
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
            Enterprise IT Helpdesk & Fleet Management Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Work Email, Username or Employee ID
            </label>
            <input
              id="login-email"
              type="text"
              placeholder="e.g. tanmay, EMP-101 or tanmay@flymedia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
              required
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              background: '#0284c7',
              color: '#ffffff',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
              opacity: loading ? 0.7 : 1
            }}
          >
            <LogIn size={16} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* 1-Click Quick Demo Accounts Switcher */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Sparkles size={14} color="#0284c7" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Instant Demo Logins (1-Click)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {demoAccounts.map(demo => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleLogin(demo.email, 'Password@123')}
                  style={{
                    background: demo.bg,
                    border: '1px solid #e2e8f0',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: demo.color, fontSize: '0.75rem', fontWeight: 700 }}>
                    <Icon size={13} />
                    <span>{demo.role}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: 600 }}>{demo.name}</span>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '10px' }}>
            Default demo password: <code>Password@123</code>
          </p>
        </div>
      </div>
    </div>
  );
};
