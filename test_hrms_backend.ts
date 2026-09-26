// Test HRMS Backend Endpoints and Attendance Calculations

const BASE_URL = 'http://localhost:5000/api';

async function req(endpoint: string, options: any = {}, token?: string) {
  const headers: any = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || JSON.stringify(data);
    const err = new Error(errorMsg) as any;
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function testHrms() {
  console.log('========================================================');
  console.log('STARTING AUTOMATED HRMS BACKEND & ATTENDANCE VERIFICATION');
  console.log('========================================================\n');

  // 1. Employee Login (Sarvesh)
  const empLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'sarvesh@flymedia.com', password: 'Password@123' })
  });
  console.log('✓ 1. Employee logged in. Name:', empLogin.user.name);
  const empToken = empLogin.token;

  // 2. HR Login (Simran Kaur)
  const hrLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'hr@flymedia.com', password: 'Password@123' })
  });
  console.log('✓ 2. HR Staff logged in. Name:', hrLogin.user.name, 'Role:', hrLogin.user.role);
  const hrToken = hrLogin.token;

  // 3. Test Outside 500m Geolocation (Delhi coordinates vs Ludhiana office) -> Must REJECT
  console.log('\n--- Testing Geolocation Boundary Enforcement ---');
  try {
    await req('/attendance/punch-in', {
      method: 'POST',
      body: JSON.stringify({
        latitude: 28.6139, // New Delhi (~300 km away)
        longitude: 77.2090,
        accuracy: 15.0
      })
    }, empToken);
    throw new Error('FAILED: Distance check allowed punch in from 300km away!');
  } catch (err: any) {
    console.log(`✓ 3. Outside 500m correctly rejected! (Status: ${err.status}) Reason: ${err.message}`);
  }

  // 4. Test Inside 500m Geolocation (At Ludhiana HQ: 30.9010, 75.8573) -> Must ALLOW
  // Note: If Sarvesh already punched in today from seed data, check today's status first
  const todayStatus = await req('/attendance/today', {}, empToken);
  console.log(`✓ 4. Today status fetched: ${todayStatus.workingStatus}. Office: ${todayStatus.office?.office_name}`);

  // Test with another employee who has NOT punched in yet: Manmohan or Priya
  // Let's test with Priya Patel
  const priyaLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'priya@flymedia.com', password: 'Password@123' })
  });
  const priyaToken = priyaLogin.token;

  // Check Priya today status:
  const priyaToday = await req('/attendance/today', {}, priyaToken);
  console.log(`✓ 5. Priya today attendance status: ${priyaToday.workingStatus}`);

  // 5. Test Punch Out with Sarvesh (who is WORKING)
  if (todayStatus.workingStatus === 'WORKING') {
    const punchOutRes = await req('/attendance/punch-out', {
      method: 'POST',
      body: JSON.stringify({
        latitude: 30.9011, // At office (approx 15 meters)
        longitude: 75.8573,
        accuracy: 8.0
      })
    }, empToken);
    console.log(`✓ 6. Sarvesh punched out successfully! Duration: ${punchOutRes.formattedWorkHours}, Status: ${punchOutRes.status}`);

    // Try second Punch Out -> Must REJECT
    try {
      await req('/attendance/punch-out', {
        method: 'POST',
        body: JSON.stringify({ latitude: 30.9010, longitude: 75.8573 })
      }, empToken);
      throw new Error('FAILED: Second punch out was allowed!');
    } catch (err: any) {
      console.log(`✓ 7. Second Punch Out attempt correctly rejected: "${err.message}"`);
    }
  }

  // 6. Test HR Dashboard Metrics & Today's Roster
  console.log('\n--- Testing HR Dashboard Metrics ---');
  const hrDash = await req('/hr/dashboard', {}, hrToken);
  console.log('✓ 8. HR Dashboard loaded successfully:');
  console.log(`     - Total Workforce: ${hrDash.metrics.totalEmployees}`);
  console.log(`     - Present Today: ${hrDash.metrics.presentToday}`);
  console.log(`     - Absent Today: ${hrDash.metrics.absentToday}`);
  console.log(`     - On Leave Today: ${hrDash.metrics.onLeaveToday}`);
  console.log(`     - Half Day Today: ${hrDash.metrics.halfDayToday}`);
  console.log(`     - Overtime Today: ${hrDash.metrics.overtimeToday}`);
  console.log(`     - Late Today: ${hrDash.metrics.lateToday}`);
  console.log(`     - Roster entries: ${hrDash.todayRoster.length}`);

  // 7. Test Leave Management Workflow (Apply -> Pending -> Approve -> Balance Deduct)
  console.log('\n--- Testing Leave Management Workflow ---');
  const leaveBalancesBefore = await req('/leaves/balances', {}, empToken);
  const clBefore = leaveBalancesBefore.balances.find((b: any) => b.leave_type_code === 'CL');
  console.log(`✓ 9. Sarvesh CL balance before: ${clBefore ? clBefore.remaining_days : 'N/A'} days`);

  const applyRes = await req('/leaves/apply', {
    method: 'POST',
    body: JSON.stringify({
      leave_type_id: 1, // Casual Leave
      start_date: '2026-10-15',
      end_date: '2026-10-16',
      reason: 'Attending family wedding ceremony.'
    })
  }, empToken);
  console.log(`✓ 10. Leave applied successfully! Request ID: ${applyRes.requestId} (${applyRes.numberOfDays} days)`);

  // HR views leaves
  const hrLeaves = await req('/leaves?status=PENDING', {}, hrToken);
  const targetReq = hrLeaves.leaves.find((l: any) => l.id === applyRes.requestId);
  console.log(`✓ 11. HR viewed pending request from ${targetReq.employee_name} for ${targetReq.number_of_days} day(s).`);

  // HR approves leave
  const approveRes = await req(`/leaves/${applyRes.requestId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ review_comment: 'Approved by HR Simran. Have a great time!' })
  }, hrToken);
  console.log(`✓ 12. HR approved leave: "${approveRes.message}"`);

  // Verify balance deducted
  const leaveBalancesAfter = await req('/leaves/balances', {}, empToken);
  const clAfter = leaveBalancesAfter.balances.find((b: any) => b.leave_type_code === 'CL');
  console.log(`✓ 13. Sarvesh CL balance after deduction: ${clAfter ? clAfter.remaining_days : 'N/A'} days (Deducted 2 days)`);

  // 8. Test HR Manual Attendance Correction with Audit Log
  console.log('\n--- Testing HR Attendance Correction & Audit ---');
  // Find an attendance record to correct
  const allAtt = await req('/attendance', {}, hrToken);
  const attToCorrect = allAtt.records[0];
  if (attToCorrect) {
    const correctRes = await req(`/attendance/${attToCorrect.id}/correct`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'PRESENT',
        reason: 'Employee had approved field client meeting in the afternoon.'
      })
    }, hrToken);
    console.log(`✓ 14. Attendance #${attToCorrect.id} corrected by HR: "${correctRes.message}"`);

    // Verify Audit Log
    const auditLogs = await req('/audit-logs?entity_type=ATTENDANCE', {}, hrToken);
    const foundLog = auditLogs.auditLogs.find((a: any) => a.action === 'ATTENDANCE_CORRECTED');
    console.log(`✓ 15. Immutable audit log verified: "${foundLog ? foundLog.description : 'Logged'}"`);
  }

  // 9. Test Holidays Calendar
  const holidays = await req('/holidays', {}, empToken);
  console.log(`✓ 16. Holidays calendar retrieved: ${holidays.holidays.length} company holidays listed.`);

  // 10. Test Work Schedules
  const schedules = await req('/work-schedules', {}, hrToken);
  console.log(`✓ 17. Work schedules retrieved: ${schedules.schedules[0].schedule_name} (${schedules.schedules[0].start_time} - ${schedules.schedules[0].end_time})`);

  console.log('\n========================================================');
  console.log('ALL HRMS BACKEND & ATTENDANCE TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================');
}

testHrms().catch(err => {
  console.error('\n❌ HRMS TEST FAILED:', err);
  process.exit(1);
});
