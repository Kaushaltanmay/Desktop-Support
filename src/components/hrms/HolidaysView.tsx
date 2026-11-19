import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Calendar, Plus, Sparkles, X, AlertCircle } from 'lucide-react';

interface HolidaysViewProps {
  currentUser: any;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const HolidaysView: React.FC<HolidaysViewProps> = ({ currentUser, showToast }) => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const isHR = currentUser?.role === 'HR' || currentUser?.role === 'ADMIN';

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await api.holidays.getAll();
      setHolidays(res.holidays || []);
    } catch (err) {
      console.error('Failed to load holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) {
      setError('Holiday name and date are required.');
      return;
    }

    try {
      setError('');
      await api.holidays.create({ name, date, description });
      showToast('Holiday added to calendar.');
      setIsAddOpen(false);
      setName('');
      setDate('');
      setDescription('');
      fetchHolidays();
    } catch (err: any) {
      setError(err.message || 'Failed to add holiday.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      
      {/* Title & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Official Holiday Calendar
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Paid corporate non-working days and national observances for Fly Media Technology.
          </p>
        </div>

        {isHR && (
          <button
            onClick={() => setIsAddOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0284c7',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            <Plus size={16} />
            <span>Add Holiday</span>
          </button>
        )}
      </div>

      {/* Holidays Grid */}
      <div className="grid-responsive-cards" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {holidays.map(h => {
          const holDate = new Date(h.date);
          const isUpcoming = holDate >= new Date();
          return (
            <div key={h.id} className="app-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: isUpcoming ? '#e0f2fe' : '#f1f5f9',
                    color: isUpcoming ? '#0284c7' : '#64748b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1.1
                  }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      {holDate.toLocaleDateString([], { month: 'short' })}
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                      {holDate.getDate()}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      {h.name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {holDate.toLocaleDateString([], { weekday: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: isUpcoming ? '#ecfdf5' : '#f8fafc',
                  color: isUpcoming ? '#059669' : '#94a3b8',
                  border: isUpcoming ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                }}>
                  {isUpcoming ? 'Upcoming' : 'Past'}
                </span>
              </div>

              {h.description && (
                <p style={{ fontSize: '0.8rem', color: '#475569', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                  {h.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Holiday Modal */}
      {isAddOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '20px'
        }}>
          <div className="app-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '460px',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Add Company Holiday
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                style={{ background: 'transparent', padding: '4px', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '10px',
                color: '#dc2626',
                fontSize: '0.82rem',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Holiday Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gurpurab / New Year's Day"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Holiday Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief note or celebration details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700
                  }}
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
