// Attendance Turnaround, Overtime, Late Arrival & Status Calculation Utilities

export interface WorkSchedule {
  start_time: string; // "09:30" (HH:MM 24h)
  end_time: string;   // "18:30"
  grace_period_minutes: number; // 10
  expected_hours: number;       // 9.0
  half_day_min_hours: number;   // 4.0
  full_day_min_hours: number;   // 8.0
  standard_daily_minutes: number; // 540
}

export const DEFAULT_SCHEDULE: WorkSchedule = {
  start_time: '09:30',
  end_time: '18:30',
  grace_period_minutes: 10,
  expected_hours: 9.0,
  half_day_min_hours: 4.0,
  full_day_min_hours: 8.0,
  standard_daily_minutes: 540
};

/**
 * Calculates late arrival in minutes beyond the allowed grace period.
 * @param punchInDate Date object of actual punch in
 * @param scheduledStartTime "09:30"
 * @param gracePeriodMinutes e.g. 10 minutes
 */
export function calculateLateMinutes(
  punchInDate: Date,
  scheduledStartTime: string = DEFAULT_SCHEDULE.start_time,
  gracePeriodMinutes: number = DEFAULT_SCHEDULE.grace_period_minutes
): number {
  const [schedH, schedM] = scheduledStartTime.split(':').map(Number);
  
  const schedTime = new Date(punchInDate);
  schedTime.setHours(schedH, schedM, 0, 0);

  const graceThreshold = new Date(schedTime.getTime() + gracePeriodMinutes * 60000);

  if (punchInDate > graceThreshold) {
    const diffMs = punchInDate.getTime() - schedTime.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  }

  return 0;
}

/**
 * Calculates working metrics, overtime, and final attendance status upon Punch Out.
 */
export function calculateAttendanceMetrics(
  punchInDate: Date,
  punchOutDate: Date,
  schedule: WorkSchedule = DEFAULT_SCHEDULE
): {
  totalWorkMinutes: number;
  regularWorkMinutes: number;
  overtimeMinutes: number;
  status: 'PRESENT' | 'HALF_DAY' | 'ABSENT';
} {
  const diffMs = punchOutDate.getTime() - punchInDate.getTime();
  const totalWorkMinutes = Math.max(0, Math.floor(diffMs / 60000));

  const standardMinutes = schedule.standard_daily_minutes || 540;
  const fullDayMinutes = (schedule.full_day_min_hours || 8.0) * 60;
  const halfDayMinutes = (schedule.half_day_min_hours || 4.0) * 60;

  // Regular hours capped at standard working minutes (e.g. 540 min = 9h)
  const regularWorkMinutes = Math.min(totalWorkMinutes, standardMinutes);

  // Overtime is any duration exceeding standard daily minutes
  const overtimeMinutes = totalWorkMinutes > standardMinutes ? totalWorkMinutes - standardMinutes : 0;

  // Status classification
  let status: 'PRESENT' | 'HALF_DAY' | 'ABSENT' = 'ABSENT';
  if (totalWorkMinutes >= fullDayMinutes) {
    status = 'PRESENT';
  } else if (totalWorkMinutes >= halfDayMinutes) {
    status = 'HALF_DAY';
  } else {
    status = 'ABSENT';
  }

  return {
    totalWorkMinutes,
    regularWorkMinutes,
    overtimeMinutes,
    status
  };
}

/**
 * Formats minutes into human-readable duration, e.g. "9h 07m", "0h 00m"
 */
export function formatMinutes(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0h 00m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}
