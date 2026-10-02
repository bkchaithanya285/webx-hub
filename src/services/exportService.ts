import { eventStore } from './store';

function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// 1. MEMBER-LEVEL EXPORT FOR A SESSION
export function exportMemberLevelAttendance(sessionId: string) {
  const session = eventStore.getAttendanceSessions().find(s => s.sessionId === sessionId);
  if (!session) return;

  const teamsData = eventStore.getAllTeamsSessionAttendance(sessionId);
  const sessionName = session.name || session.sessionName || 'Attendance Session';
  const sessionDate = session.date || '';

  const headers = [
    'Session ID',
    'Session Name',
    'Date',
    'Team ID',
    'Team Name',
    'Member Name',
    'Registration Number',
    'Email',
    'Attendance Status',
    'Marked At',
    'Marked By'
  ];

  const rows: string[][] = [];
  teamsData.forEach(team => {
    team.members.forEach(m => {
      rows.push([
        session.sessionId,
        sessionName,
        sessionDate,
        team.teamId,
        team.teamName,
        m.name,
        m.registrationNumber,
        m.email,
        m.status,
        m.markedAt ? new Date(m.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (team.submitted ? 'Marked' : 'N/A'),
        m.overriddenBy ? `Admin Override (${m.overriddenBy})` : (team.volunteerName || (team.submitted ? 'Volunteer' : 'N/A'))
      ]);
    });
  });

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\r\n');

  const filename = `WEBX_Attendance_${sessionId}_Members_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csvContent);
}

// 2. TEAM SUMMARY EXPORT FOR A SESSION
export function exportTeamSummaryAttendance(sessionId: string) {
  const session = eventStore.getAttendanceSessions().find(s => s.sessionId === sessionId);
  if (!session) return;

  const teamsData = eventStore.getAllTeamsSessionAttendance(sessionId);

  const headers = [
    'Team ID',
    'Team Name',
    'Total Members',
    'Present',
    'Absent',
    'Team Status',
    'Submission Time',
    'Submitted By'
  ];

  const rows = teamsData.map(t => [
    t.teamId,
    t.teamName,
    t.totalMembers,
    t.presentCount,
    t.absentCount,
    t.status,
    t.submittedAt ? new Date(t.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not Submitted',
    t.volunteerName || (t.submitted ? 'Volunteer' : 'N/A')
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\r\n');

  const filename = `WEBX_Attendance_${sessionId}_Team_Summary_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csvContent);
}

// 3. SESSION SUMMARY EXPORT
export function exportSessionSummaryReport(sessionId: string) {
  const stats = eventStore.getSessionStatistics(sessionId);
  if (!stats.session) return;

  const headers = [
    'Session Name',
    'Date',
    'Total Teams',
    'Present Teams',
    'Partial Teams',
    'Absent Teams',
    'Not Marked Teams',
    'Total Participants',
    'Present Participants',
    'Absent Participants',
    'Attendance Percentage'
  ];

  const row = [
    stats.session.name || stats.session.sessionName,
    stats.session.date,
    stats.totalTeams,
    stats.presentTeams,
    stats.partialTeams,
    stats.absentTeams,
    stats.notMarkedTeams,
    stats.totalParticipants,
    stats.presentParticipants,
    stats.absentParticipants,
    stats.attendancePercentage
  ];

  const csvContent = [
    headers.map(escapeCSV).join(','),
    row.map(escapeCSV).join(',')
  ].join('\r\n');

  const filename = `WEBX_Attendance_${sessionId}_Session_Report_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csvContent);
}

// 4. ALL ATTENDANCE EXPORT (ACROSS ALL SESSIONS)
export function exportAllAttendanceAcrossSessions() {
  const sessions = eventStore.getAttendanceSessions();

  const headers = [
    'Session',
    'Date',
    'Team ID',
    'Team Name',
    'Member Name',
    'Registration Number',
    'Status',
    'Marked At',
    'Volunteer'
  ];

  const rows: string[][] = [];
  sessions.forEach(session => {
    const teamsData = eventStore.getAllTeamsSessionAttendance(session.sessionId);
    teamsData.forEach(team => {
      team.members.forEach(m => {
        rows.push([
          session.name || session.sessionName,
          session.date,
          team.teamId,
          team.teamName,
          m.name,
          m.registrationNumber,
          m.status,
          m.markedAt ? new Date(m.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (team.submitted ? 'Marked' : 'N/A'),
          m.overriddenBy ? `Admin Override (${m.overriddenBy})` : (team.volunteerName || (team.submitted ? 'Volunteer' : 'N/A'))
        ]);
      });
    });
  });

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\r\n');

  const filename = `WEBX_All_Attendance_Complete_Export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csvContent);
}
