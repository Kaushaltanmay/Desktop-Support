import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { api } from '../../services/api';
import { 
  LogIn, 
  LogOut, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Navigation, 
  ShieldAlert, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Smartphone
} from 'lucide-react';

interface EmployeePunchCardProps {
  todayData: any;
  onAttendanceUpdated: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const EmployeePunchCard: React.FC<EmployeePunchCardProps> = ({
  todayData,
  onAttendanceUpdated,
  showToast
}) => {
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [useOfficeGpsMock, setUseOfficeGpsMock] = useState(true); // Default to true for zero-friction testing
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const attendance = todayData?.attendance;
  const office = todayData?.office || {
    office_name: 'Fly Media Technology - Ludhiana HQ',
    latitude: 30.9010,
    longitude: 75.8573,
    allowed_radius_meters: 500
  };

  const isWorking = todayData?.workingStatus === 'WORKING';
  const isPunchedOut = todayData?.workingStatus === 'PUNCHED_OUT';
  const isNotPunched = todayData?.workingStatus === 'NOT_PUNCHED';

  // Live timer for elapsed work minutes if currently working
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  useEffect(() => {
    if (isWorking && attendance?.punch_in_at) {
      const calc = () => {
        const start = new Date(attendance.punch_in_at).getTime();
        const diff = Date.now() - start;
        setElapsedMinutes(Math.max(0, Math.floor(diff / 60000)));
      };
      calc();
      const interval = setInterval(calc, 30000);
      return () => clearInterval(interval);
    }
  }, [isWorking, attendance]);

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  // Acquire coordinates
  const getCoordinates = async (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
    if (useOfficeGpsMock) {
      // Office coordinates (Plot 42, IT Park Ludhiana) - exact location
      return {
        latitude: office.latitude || 30.9010,
        longitude: office.longitude || 75.8573,
        accuracy: 10.0
      };
    }

    // Check if running on native mobile device via Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        const permStatus = await Geolocation.checkPermissions();
        if (permStatus.location !== 'granted') {
          const reqStatus = await Geolocation.requestPermissions();
          if (reqStatus.location !== 'granted') {
            throw new Error('Location permission is required for mobile geofence punch-in.');
          }
        }
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
        });
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 10.0
        };
      } catch (nativeErr: any) {
        console.warn('Native geolocation failed, falling back to browser API:', nativeErr);
      }
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your device browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          let msg = 'Failed to obtain GPS coordinates.';
          if (err.code === 1) msg = 'Location permission was denied. Please allow location access in your device settings.';
          else if (err.code === 2) msg = 'Location unavailable. Please verify GPS settings.';
          else if (err.code === 3) msg = 'Location request timed out. Please try again.';
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // Punch In Handler
  const handlePunchIn = async () => {
    try {
      setLoading(true);
      setGpsError(null);
      const coords = await getCoordinates();
      const res = await api.attendance.punchIn({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        device_information: navigator.userAgent
      });
      showToast(res.message, 'success');
      onAttendanceUpdated();
    } catch (err: any) {
      const msg = err.message || 'Failed to punch in.';
      setGpsError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Punch Out Handler
  const handlePunchOut = async () => {
    try {
      setLoading(true);
      setGpsError(null);
      const coords = await getCoordinates();
      const res = await api.attendance.punchOut({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        device_information: navigator.userAgent
      });
      showToast(res.message, 'success');
      onAttendanceUpdated();
    } catch (err: any) {
      const msg = err.message || 'Failed to punch out.';
      setGpsError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-card" style={{
      padding: '28px',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      boxShadow: 'var(--shadow-card)'
    }}>
      {/* Top Banner: Date & Live Clock */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '18px'
      }}>
        <div>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', fontWeight: 700 }}>
            Biometric & Geolocation Attendance
          </span>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            Today's Attendance
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Live Digital Clock */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '8px 18px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Clock size={20} color="#0284c7" />
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Metric Readout Cards: Punch In, Punch Out, Working Hours, Overtime */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px'
      }}>
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Punch In</span>
          <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {attendance?.punch_in_at
              ? new Date(attendance.punch_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '--:--'}
          </p>
        </div>

        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Punch Out</span>
          <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {attendance?.punch_out_at
              ? new Date(attendance.punch_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : isWorking ? 'In Progress' : '--:--'}
          </p>
        </div>

        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Working Hours</span>
          <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
            {attendance?.total_work_minutes
              ? formatHoursMins(attendance.total_work_minutes)
              : isWorking ? formatHoursMins(elapsedMinutes) : '0h 00m'}
          </p>
        </div>

        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Overtime</span>
          <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {formatHoursMins(attendance?.overtime_minutes || 0)}
          </p>
        </div>

        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Status</span>
          <div style={{ marginTop: '4px' }}>
            <span className={
              attendance?.status === 'PRESENT' ? 'badge-resolved' :
              attendance?.status === 'WORKING' ? 'badge-in-progress' :
              attendance?.status === 'HALF_DAY' ? 'badge-open' : 'badge-waiting'
            }>
              {attendance?.status || 'NOT PUNCHED'}
            </span>
          </div>
        </div>
      </div>

      {/* Prominent Action Buttons: [PUNCH IN] and [PUNCH OUT] */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        paddingTop: '6px'
      }}>
        {/* PUNCH IN BUTTON */}
        <button
          id="btn-punch-in"
          onClick={handlePunchIn}
          disabled={loading || !isNotPunched}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '16px 24px',
            borderRadius: '12px',
            background: isNotPunched ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f1f5f9',
            color: isNotPunched ? '#ffffff' : '#94a3b8',
            fontSize: '1.05rem',
            fontWeight: 800,
            cursor: isNotPunched ? 'pointer' : 'not-allowed',
            boxShadow: isNotPunched ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
            border: 'none',
            transition: 'all 0.2s'
          }}
        >
          <LogIn size={20} />
          <span>{loading ? 'Verifying GPS...' : 'PUNCH IN'}</span>
        </button>

        {/* PUNCH OUT BUTTON */}
        <button
          id="btn-punch-out"
          onClick={handlePunchOut}
          disabled={loading || !isWorking}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '16px 24px',
            borderRadius: '12px',
            background: isWorking ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#f1f5f9',
            color: isWorking ? '#ffffff' : '#94a3b8',
            fontSize: '1.05rem',
            fontWeight: 800,
            cursor: isWorking ? 'pointer' : 'not-allowed',
            boxShadow: isWorking ? '0 4px 14px rgba(239, 68, 68, 0.35)' : 'none',
            border: 'none',
            transition: 'all 0.2s'
          }}
        >
          <LogOut size={20} />
          <span>{loading ? 'Verifying GPS...' : 'PUNCH OUT'}</span>
        </button>
      </div>

      {/* Geolocation Verification & Testing Mode Selector */}
      <div style={{
        background: '#faf5ff',
        border: '1px solid #ddd6fe',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Navigation size={18} color="#8b5cf6" />
          <div>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
              Office Geofence: {office.office_name}
            </p>
            <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Required radius: Within 500m of office coordinates ({office.latitude?.toFixed(4)}, {office.longitude?.toFixed(4)})
            </p>
          </div>
        </div>

        {/* GPS Testing Mode Toggle for immediate convenience */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            GPS Source:
          </span>
          <button
            onClick={() => setUseOfficeGpsMock(!useOfficeGpsMock)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: useOfficeGpsMock ? '#059669' : '#0284c7'
            }}
          >
            {useOfficeGpsMock ? <ToggleRight size={18} color="#059669" /> : <ToggleLeft size={18} color="#64748b" />}
            <span>{useOfficeGpsMock ? 'Office Simulated GPS (Inside 500m)' : 'Current Device GPS'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner if GPS or Rule Violated */}
      {gpsError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#b91c1c',
          fontSize: '0.82rem'
        }}>
          <ShieldAlert size={16} />
          <span>{gpsError}</span>
        </div>
      )}
    </div>
  );
};
