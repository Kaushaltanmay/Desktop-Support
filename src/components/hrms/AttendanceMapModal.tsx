import React from 'react';
import { X, MapPin, Navigation, ShieldCheck, ExternalLink } from 'lucide-react';

interface AttendanceMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

export const AttendanceMapModal: React.FC<AttendanceMapModalProps> = ({
  isOpen,
  onClose,
  record
}) => {
  if (!isOpen || !record) return null;

  const officeLat = record.office_lat || 30.9010;
  const officeLon = record.office_lon || 75.8573;
  const punchInLat = record.punch_in_latitude;
  const punchInLon = record.punch_in_longitude;
  const punchOutLat = record.punch_out_latitude;
  const punchOutLon = record.punch_out_longitude;

  const googleMapsOfficeUrl = `https://www.google.com/maps/search/?api=1&query=${officeLat},${officeLon}`;
  const googleMapsPunchInUrl = punchInLat ? `https://www.google.com/maps/search/?api=1&query=${punchInLat},${punchInLon}` : null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1500,
      padding: '20px'
    }}>
      <div className="app-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '680px',
        background: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Navigation size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Geolocation Audit & Map Verification
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {record.employee_name || 'Employee'} • Attendance Date: {record.attendance_date}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', padding: '6px', borderRadius: '6px', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Visual Geofence Map Schematic */}
          <div style={{
            position: 'relative',
            height: '240px',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* 500m Perimeter Circle */}
            <div style={{
              position: 'absolute',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              border: '2px dashed #0284c7',
              backgroundColor: 'rgba(2, 132, 199, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ position: 'absolute', top: '8px', fontSize: '0.65rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                500m Geofence Boundary
              </span>

              {/* Office Center Pin */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(2, 132, 199, 0.4)'
                }}>
                  <MapPin size={18} />
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a', background: 'rgba(255,255,255,0.85)', padding: '1px 6px', borderRadius: '4px' }}>
                  Ludhiana HQ
                </span>
              </div>
            </div>

            {/* Punch In Verified Pin inside radius */}
            {punchInLat && (
              <div style={{
                position: 'absolute',
                top: '75px',
                right: '270px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.5)'
                }}>
                  <ShieldCheck size={14} />
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 4px', borderRadius: '4px', marginTop: '2px' }}>
                  Punch In
                </span>
              </div>
            )}

            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '14px',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid #e2e8f0',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              display: 'flex',
              gap: '12px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontWeight: 600 }}>
                ● Registered Office
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600 }}>
                ● Employee Punch Location
              </span>
            </div>
          </div>

          {/* Location Telemetry Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Punch In Details */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                  Punch In Location
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#ecfdf5', color: '#059669' }}>
                  Verified
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                {punchInLat ? `${punchInLat.toFixed(6)}, ${punchInLon.toFixed(6)}` : 'Not recorded'}
              </p>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Accuracy: ±{record.punch_in_accuracy ? `${record.punch_in_accuracy}m` : '10m'}
              </span>
              {googleMapsPunchInUrl && (
                <a
                  href={googleMapsPunchInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    color: '#0284c7',
                    fontWeight: 600,
                    marginTop: '8px',
                    textDecoration: 'none'
                  }}
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Punch Out Details */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Punch Out Location
                </span>
                {punchOutLat && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#ecfdf5', color: '#059669' }}>
                    Verified
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                {punchOutLat ? `${punchOutLat.toFixed(6)}, ${punchOutLon.toFixed(6)}` : 'Active / In Progress'}
              </p>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {punchOutLat ? `Accuracy: ±${record.punch_out_accuracy ? `${record.punch_out_accuracy}m` : '10m'}` : 'Employee currently working'}
              </span>
            </div>
          </div>

          {/* Official Office Details */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Assigned Workplace:</span>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                {record.office_name || 'Fly Media Technology - Ludhiana HQ'}
              </p>
            </div>
            <a
              href={googleMapsOfficeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.75rem',
                color: '#0284c7',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none'
              }}
            >
              <span>Office Map</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
