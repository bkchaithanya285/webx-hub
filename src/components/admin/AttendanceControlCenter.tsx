import React, { useState, useEffect } from 'react';
import { AttendanceSession, Team, AuditLog } from '../../types';
import { eventStore } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import {
  exportMemberLevelAttendance,
  exportTeamSummaryAttendance,
  exportSessionSummaryReport,
  exportAllAttendanceAcrossSessions
} from '../../services/exportService';
import {
  CalendarCheck,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Search,
  Download,
  Trash2,
  Edit,
  Eye,
  ArrowLeft,
  Filter,
  Clock,
  Users,
  ShieldAlert,
  FileSpreadsheet,
  Check,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export const AttendanceControlCenter: React.FC = () => {
  const { currentUser } = useAuth();

  // Sessions and summary from store
  const [sessions, setSessions] = useState<AttendanceSession[]>(eventStore.getAttendanceSessions());
  const [summary, setSummary] = useState(eventStore.getAttendanceSummaryForDashboard());

  // Active subview: null = list, sessionId = detailed session view
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<AttendanceSession | null>(null);
  const [closeConfirmSession, setCloseConfirmSession] = useState<AttendanceSession | null>(null);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<AttendanceSession | null>(null);

  // Form states for Create/Edit
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');

  // Selected team for details modal
  const [selectedTeamData, setSelectedTeamData] = useState<any | null>(null);

  // Override modal state
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    teamId: string;
    teamName: string;
    memberId: string;
    memberName: string;
    currentStatus: 'PRESENT' | 'ABSENT' | 'NOT MARKED';
    newStatus: 'PRESENT' | 'ABSENT';
    reason: string;
  } | null>(null);

  // Filter & Search inside Session Detail View
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'PARTIAL' | 'ABSENT' | 'NOT MARKED'>('ALL');

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    const update = () => {
      setSessions([...eventStore.getAttendanceSessions()]);
      setSummary(eventStore.getAttendanceSummaryForDashboard());
    };
    update();
    return eventStore.subscribe(update);
  }, []);

  const handleOpenCreateModal = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    setFormName(`Round ${sessions.length + 1} Attendance`);
    setFormDesc('');
    setFormDate(dateStr);
    setFormStartTime(timeStr);
    setFormEndTime('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotification('error', 'Session Name is required.');
      return;
    }

    const res = eventStore.createAttendanceSession(
      currentUser?.uid || 'admin',
      currentUser?.email || 'admin@klu.ac.in',
      {
        name: formName.trim(),
        description: formDesc.trim(),
        date: formDate.trim() || new Date().toLocaleDateString('en-GB'),
        startTime: formStartTime.trim() || '02:00 PM',
        endTime: formEndTime.trim()
      }
    );

    if (res.success) {
      showNotification('success', `Created attendance session "${formName}" in DRAFT mode.`);
      setIsCreateModalOpen(false);
    } else {
      showNotification('error', res.error || 'Failed to create session.');
    }
  };

  const handleOpenEditModal = (session: AttendanceSession) => {
    setSessionToEdit(session);
    setFormName(session.name || session.sessionName);
    setFormDesc(session.description || '');
    setFormDate(session.date || '');
    setFormStartTime(session.startTime || '');
    setFormEndTime(session.endTime || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToEdit) return;

    const res = eventStore.editAttendanceSession(
      currentUser?.uid || 'admin',
      currentUser?.email || 'admin@klu.ac.in',
      sessionToEdit.sessionId,
      {
        name: formName.trim(),
        description: formDesc.trim(),
        date: formDate.trim(),
        startTime: formStartTime.trim(),
        endTime: formEndTime.trim()
      }
    );

    if (res.success) {
      showNotification('success', `Session "${formName}" updated successfully.`);
      setIsEditModalOpen(false);
      setSessionToEdit(null);
    } else {
      showNotification('error', res.error || 'Failed to update session.');
    }
  };

  const handleOpenSession = (session: AttendanceSession) => {
    const res = eventStore.openAttendanceSession(
      currentUser?.uid || 'admin',
      currentUser?.email || 'admin@klu.ac.in',
      session.sessionId
    );

    if (!res.success) {
      showNotification('error', res.error || 'Failed to open session.');
    } else {
      showNotification('success', `Attendance session "${session.name || session.sessionName}" is now ACTIVE. Volunteers can scan team QR codes.`);
    }
  };

  const handleConfirmCloseSession = () => {
    if (!closeConfirmSession) return;
    const res = eventStore.closeAttendanceSession(
      currentUser?.uid || 'admin',
      currentUser?.email || 'admin@klu.ac.in',
      closeConfirmSession.sessionId
    );

    if (res.success) {
      showNotification('success', `Session "${closeConfirmSession.name || closeConfirmSession.sessionName}" has been CLOSED.`);
      setCloseConfirmSession(null);
    } else {
      showNotification('error', res.error || 'Failed to close session.');
    }
  };

  const handleConfirmDeleteSession = () => {
    if (!deleteConfirmSession) return;
    const res = eventStore.deleteAttendanceSession(
      currentUser?.uid || 'admin',
      currentUser?.email || 'admin@klu.ac.in',
      deleteConfirmSession.sessionId
    );

    if (res.success) {
      showNotification('success', `Permanently deleted session and associated records.`);
      if (activeSessionId === deleteConfirmSession.sessionId) {
        setActiveSessionId(null);
      }
      setDeleteConfirmSession(null);
    } else {
      showNotification('error', res.error || 'Failed to delete session.');
    }
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModal) return;

    if (!overrideModal.reason || !overrideModal.reason.trim()) {
      showNotification('error', 'Reason for attendance override is strictly required.');
      return;
    }

    if (!activeSessionId) return;

    const res = eventStore.overrideMemberAttendance(
      currentUser?.uid || 'admin',
      currentUser?.email || 'admin@klu.ac.in',
      activeSessionId,
      overrideModal.teamId,
      overrideModal.memberId,
      overrideModal.newStatus,
      overrideModal.reason.trim()
    );

    if (res.success) {
      showNotification('success', `Successfully updated ${overrideModal.memberName} to ${overrideModal.newStatus}. Audit logged.`);
      setOverrideModal(null);
      // Refresh team detail modal if currently open
      if (selectedTeamData && selectedTeamData.teamId === overrideModal.teamId) {
        const teamsData = eventStore.getAllTeamsSessionAttendance(activeSessionId);
        const updated = teamsData.find(t => t.teamId === overrideModal.teamId);
        if (updated) setSelectedTeamData(updated);
      }
    } else {
      showNotification('error', res.error || 'Failed to override attendance.');
    }
  };

  // RENDER DETAILED SESSION VIEW (when activeSessionId is set)
  if (activeSessionId) {
    const session = sessions.find(s => s.sessionId === activeSessionId);
    if (!session) {
      setActiveSessionId(null);
      return null;
    }

    const stats = eventStore.getSessionStatistics(session.sessionId);
    const allTeamsData = eventStore.getAllTeamsSessionAttendance(session.sessionId);

    // Apply Filter & Search
    const filteredTeams = allTeamsData.filter(team => {
      // Filter by status
      if (statusFilter !== 'ALL' && team.status !== statusFilter) {
        return false;
      }
      // Search query across Team ID, Team Name, Member Name, RegNo
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTeamId = team.teamId.toLowerCase().includes(q);
        const matchTeamName = team.teamName.toLowerCase().includes(q);
        const matchMember = team.members.some(m =>
          m.name.toLowerCase().includes(q) ||
          m.registrationNumber.toLowerCase().includes(q)
        );
        return matchTeamId || matchTeamName || matchMember;
      }
      return true;
    });

    const isSessionActive = session.status === 'ACTIVE' || session.status === 'active';

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Notification Toast */}
        {notification && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-xl ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/90 border-rose-700 text-rose-200'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Detailed Session Header */}
        <div className="rounded-3xl bg-[#0d0d1a] border border-red-900/40 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <button
              onClick={() => setActiveSessionId(null)}
              className="inline-flex items-center space-x-2 text-xs font-mono text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider mb-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Attendance Control Center</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black font-display text-white uppercase tracking-tight">
                {session.name || session.sessionName}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                isSessionActive
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-glow-emerald animate-pulse'
                  : session.status === 'CLOSED' || session.status === 'closed'
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}>
                {session.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-mono">
              <span>Date: <strong className="text-white">{session.date}</strong></span>
              <span>•</span>
              <span>Time: <strong className="text-white">{session.startTime} {session.endTime ? `- ${session.endTime}` : ''}</strong></span>
              <span>•</span>
              <span>Created by: <strong className="text-zinc-300">{session.createdBy}</strong></span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 relative z-10">
            {isSessionActive ? (
              <button
                onClick={() => setCloseConfirmSession(session)}
                className="px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-glow-crimson flex items-center space-x-1.5 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Close Session</span>
              </button>
            ) : (
              session.status === 'DRAFT' && (
                <button
                  onClick={() => handleOpenSession(session)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-glow-emerald flex items-center space-x-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Open Session</span>
                </button>
              )
            )}

            {/* Export Dropdown / Buttons */}
            <button
              onClick={() => exportMemberLevelAttendance(session.sessionId)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 border border-zinc-700 transition-all"
              title="Export complete member-by-member attendance rows"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>Member CSV</span>
            </button>

            <button
              onClick={() => exportTeamSummaryAttendance(session.sessionId)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 border border-zinc-700 transition-all"
              title="Export 60-team status summary"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Team Summary</span>
            </button>

            <button
              onClick={() => exportSessionSummaryReport(session.sessionId)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 border border-zinc-700 transition-all"
              title="Export session overall summary metrics"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Report</span>
            </button>
          </div>
        </div>

        {/* 9 TELEMETRY METRIC TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#0c0c16] border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">TOTAL TEAMS</span>
            <div className="text-2xl font-black text-white font-mono">{stats.totalTeams}</div>
            <div className="text-[10px] font-mono text-zinc-500">60 Roster Teams</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c0c16] border border-emerald-900/40 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">PRESENT TEAMS</span>
            <div className="text-2xl font-black text-emerald-400 font-mono">{stats.presentTeams}</div>
            <div className="text-[10px] font-mono text-zinc-500">100% Members In</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c0c16] border border-amber-900/40 space-y-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">PARTIAL TEAMS</span>
            <div className="text-2xl font-black text-amber-400 font-mono">{stats.partialTeams}</div>
            <div className="text-[10px] font-mono text-zinc-500">Mixed Presence</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c0c16] border border-rose-900/40 space-y-1">
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">ABSENT TEAMS</span>
            <div className="text-2xl font-black text-rose-400 font-mono">{stats.absentTeams}</div>
            <div className="text-[10px] font-mono text-zinc-500">0/4 Members In</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c0c16] border border-zinc-800 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">NOT MARKED TEAMS</span>
            <div className="text-2xl font-black text-zinc-300 font-mono">{stats.notMarkedTeams}</div>
            <div className="text-[10px] font-mono text-zinc-500">Unscanned</div>
          </div>
        </div>

        {/* PARTICIPANTS & ATTENDANCE % STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121222] to-[#0c0c16] border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">TOTAL PARTICIPANTS</span>
            <div className="text-2xl font-black text-white font-mono">{stats.totalParticipants}</div>
            <div className="text-[10px] font-mono text-zinc-500">240 Enrolled Hackers</div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0e1d16] to-[#0c0c16] border border-emerald-900/50 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">PRESENT PARTICIPANTS</span>
            <div className="text-2xl font-black text-emerald-400 font-mono">{stats.presentParticipants}</div>
            <div className="text-[10px] font-mono text-emerald-500/80">Verified on Ground</div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1f0f14] to-[#0c0c16] border border-rose-900/50 space-y-1">
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">ABSENT PARTICIPANTS</span>
            <div className="text-2xl font-black text-rose-400 font-mono">{stats.absentParticipants}</div>
            <div className="text-[10px] font-mono text-rose-500/80">
              {stats.explicitAbsentParticipants > 0 ? `${stats.explicitAbsentParticipants} Marked Absent • ${stats.unmarkedParticipants} Unmarked` : 'Missing / Unmarked (240 - Present)'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1d0e20] to-[#0c0c16] border border-red-800/60 space-y-1">
            <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">ATTENDANCE PERCENTAGE</span>
            <div className="text-3xl font-black text-white font-display tracking-tight">{stats.attendancePercentage}</div>
            <div className="text-[10px] font-mono text-red-400/80">Realtime Turnout Rate</div>
          </div>
        </div>

        {/* SEARCH AND FILTER CONTROLS */}
        <div className="p-4 rounded-2xl bg-[#0c0c16] border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Team ID, Team Name, Member Name, Reg No..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {(['ALL', 'PRESENT', 'PARTIAL', 'ABSENT', 'NOT MARKED'] as const).map(filterKey => {
              const active = statusFilter === filterKey;
              return (
                <button
                  key={filterKey}
                  onClick={() => setStatusFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${
                    active
                      ? 'bg-red-600 text-white shadow-glow-crimson'
                      : 'bg-[#121220] text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {filterKey}
                </button>
              );
            })}
          </div>
        </div>

        {/* CRITICAL: ALL 60 TEAMS TABLE */}
        <div className="rounded-3xl bg-[#0c0c16] border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-red-500" />
              <span>60-TEAM COMPLETE ATTENDANCE ROSTER ({filteredTeams.length} Shown)</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              Click any team to inspect member breakdown or execute Admin Override.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#101020] text-zinc-400 uppercase font-mono text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Team ID</th>
                  <th className="px-4 py-3">Team Name</th>
                  <th className="px-4 py-3">Presence Ratio</th>
                  <th className="px-4 py-3">Team Status</th>
                  <th className="px-4 py-3">Submission Time</th>
                  <th className="px-4 py-3">Submitted By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-500 font-sans">
                      No teams match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map(team => {
                    const status = team.status;
                    return (
                      <tr
                        key={team.teamId}
                        onClick={() => setSelectedTeamData(team)}
                        className="hover:bg-red-950/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-bold text-red-400">
                          {team.teamId}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white font-sans">
                          {team.teamName}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            team.presentCount === team.totalMembers
                              ? 'bg-emerald-950 text-emerald-300'
                              : team.presentCount > 0
                              ? 'bg-amber-950 text-amber-300'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {team.presentCount}/{team.totalMembers} Present
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            status === 'PRESENT'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : status === 'PARTIAL'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : status === 'ABSENT'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-[11px]">
                          {team.submittedAt ? new Date(team.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-[11px]">
                          {team.volunteerName || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeamData(team);
                            }}
                            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold uppercase tracking-wider inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3 text-red-400" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TEAM DETAILS MODAL */}
        {selectedTeamData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-2xl rounded-3xl bg-[#0e0e1a] border border-red-900/60 p-6 sm:p-8 space-y-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded bg-red-950 text-red-400 font-mono text-xs font-bold border border-red-800/80">
                      {selectedTeamData.teamId}
                    </span>
                    <h3 className="text-xl font-bold text-white font-display">
                      {selectedTeamData.teamName}
                    </h3>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-1">
                    Total Members: <strong className="text-white">{selectedTeamData.totalMembers}</strong> • Present: <strong className="text-emerald-400">{selectedTeamData.presentCount}</strong> • Absent: <strong className="text-rose-400">{selectedTeamData.absentCount}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTeamData(null)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Submission Telemetry */}
              <div className="p-4 rounded-2xl bg-[#121222] border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <span className="text-zinc-500 uppercase">Status: </span>
                  <span className={`font-bold ${
                    selectedTeamData.submitted ? 'text-emerald-400' : 'text-zinc-400'
                  }`}>
                    {selectedTeamData.submitted ? 'SUBMITTED' : 'Attendance not submitted.'}
                  </span>
                </div>
                {selectedTeamData.submitted && (
                  <>
                    <div>
                      <span className="text-zinc-500 uppercase">Time: </span>
                      <span className="text-zinc-300">{selectedTeamData.submittedAt ? new Date(selectedTeamData.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase">Volunteer: </span>
                      <span className="text-zinc-300">{selectedTeamData.volunteerName || 'Volunteer'}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Member-level Cards with Admin Override Action */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">
                  MEMBER ATTENDANCE BREAKDOWN
                </div>

                <div className="space-y-2.5">
                  {selectedTeamData.members.map((m: any) => {
                    const isPresent = m.status === 'PRESENT';
                    const isAbsent = m.status === 'ABSENT';

                    return (
                      <div
                        key={m.memberId}
                        className="p-4 rounded-2xl bg-[#10101e] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-white font-sans">{m.name}</span>
                            {m.isTeamLead && (
                              <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 text-[10px] font-mono">
                                LEAD
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400">
                            Reg No: <strong className="text-zinc-300">{m.registrationNumber}</strong> {m.email ? `• ${m.email}` : ''}
                          </div>
                          {m.overrideReason && (
                            <div className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-900/60 mt-1">
                              <strong>OVERRIDE:</strong> {m.overrideReason} (by {m.overriddenBy})
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 self-start sm:self-auto">
                          <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold uppercase ${
                            isPresent
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isAbsent
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {m.status}
                          </span>

                          {/* Admin Override Trigger */}
                          <button
                            onClick={() => {
                              setOverrideModal({
                                isOpen: true,
                                teamId: selectedTeamData.teamId,
                                teamName: selectedTeamData.teamName,
                                memberId: m.memberId,
                                memberName: m.name,
                                currentStatus: m.status,
                                newStatus: isPresent ? 'ABSENT' : 'PRESENT',
                                reason: ''
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-300 hover:text-red-300 text-[10px] font-mono uppercase font-bold border border-zinc-700 transition-colors"
                            title="Admin Override attendance for this member"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setSelectedTeamData(null)}
                  className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ADMIN ATTENDANCE OVERRIDE MODAL */}
        {overrideModal?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md rounded-3xl bg-[#0e0e1a] border border-red-800/80 p-6 sm:p-8 space-y-5 shadow-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">ADMIN ATTENDANCE OVERRIDE</h3>
                  <p className="text-[11px] font-mono text-zinc-400">Audited modification with mandatory reason</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121222] border border-zinc-800 text-xs font-mono space-y-1">
                <div>Team: <strong className="text-white">{overrideModal.teamId} — {overrideModal.teamName}</strong></div>
                <div>Member: <strong className="text-white">{overrideModal.memberName}</strong></div>
                <div>Current: <span className="text-zinc-300 font-bold">{overrideModal.currentStatus}</span></div>
              </div>

              <form onSubmit={handleSaveOverride} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1.5">
                    Target Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOverrideModal({ ...overrideModal, newStatus: 'PRESENT' })}
                      className={`py-2 rounded-xl text-xs font-bold uppercase font-mono border transition-all ${
                        overrideModal.newStatus === 'PRESENT'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-glow-emerald'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      PRESENT
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverrideModal({ ...overrideModal, newStatus: 'ABSENT' })}
                      className={`py-2 rounded-xl text-xs font-bold uppercase font-mono border transition-all ${
                        overrideModal.newStatus === 'ABSENT'
                          ? 'bg-rose-950 text-rose-300 border-rose-600 shadow-glow-crimson'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      ABSENT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1.5">
                    Reason for Change <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Student arrived late due to transport / verified with faculty coordinator"
                    value={overrideModal.reason}
                    onChange={(e) => setOverrideModal({ ...overrideModal, reason: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOverrideModal(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-glow-crimson"
                  >
                    Commit Override
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER MAIN ATTENDANCE CONTROL CENTER (Sessions List & Summary)
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-xl ${
          notification.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
            : 'bg-rose-950/90 border-rose-700 text-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Control Center Banner */}
      <div className="rounded-3xl bg-[#0c0c16] border border-red-900/40 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="text-[11px] font-mono text-red-400 uppercase tracking-widest font-bold">
            WEBX COMMAND • ATTENDANCE ENGINE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
            ATTENDANCE CONTROL CENTER
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Enforces strict maximum ONE active session rule. Real-time Firebase telemetry & member-level audit trails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            onClick={() => exportAllAttendanceAcrossSessions()}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 border border-zinc-700 transition-all"
            title="Export all attendance records across every session"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export All Attendance</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-glow-crimson flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ CREATE ATTENDANCE SESSION</span>
          </button>
        </div>
      </div>

      {/* 5 TOP SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Sessions */}
        <div className="p-5 rounded-2xl bg-[#0c0c16] border border-zinc-800 space-y-1.5 shadow-lg">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">TOTAL SESSIONS</span>
          <div className="text-3xl font-black text-white font-mono">{summary.totalSessions}</div>
          <div className="text-[10px] font-mono text-zinc-500">Created Check-in Rounds</div>
        </div>

        {/* Active Session */}
        <div className="p-5 rounded-2xl bg-[#0c0c16] border border-emerald-900/40 space-y-1.5 shadow-lg">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">ACTIVE SESSION</span>
          <div className="text-base font-black text-emerald-300 font-display truncate">
            {summary.activeSessionName || 'None Active'}
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400">
            {summary.activeSessionName ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Scanning Open</span>
              </>
            ) : (
              <span className="text-zinc-500">Locked / Standby</span>
            )}
          </div>
        </div>

        {/* Total Present */}
        <div className="p-5 rounded-2xl bg-[#0c0c16] border border-emerald-900/40 space-y-1.5 shadow-lg">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">TOTAL PRESENT</span>
          <div className="text-3xl font-black text-emerald-400 font-mono">{summary.totalPresent}</div>
          <div className="text-[10px] font-mono text-zinc-500">Logged Present</div>
        </div>

        {/* Total Absent */}
        <div className="p-5 rounded-2xl bg-[#0c0c16] border border-rose-900/40 space-y-1.5 shadow-lg">
          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">TOTAL ABSENT</span>
          <div className="text-3xl font-black text-rose-400 font-mono">{summary.totalAbsent}</div>
          <div className="text-[10px] font-mono text-zinc-500">Unaccounted / Absent</div>
        </div>

        {/* Attendance % */}
        <div className="p-5 rounded-2xl bg-[#0c0c16] border border-red-800/60 space-y-1.5 shadow-lg col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">ATTENDANCE %</span>
          <div className="text-3xl font-black text-white font-display">{summary.attendancePercentage}</div>
          <div className="text-[10px] font-mono text-red-400/80">Aggregate Event Turnout</div>
        </div>
      </div>

      {/* ATTENDANCE SESSIONS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold font-display text-white uppercase tracking-wider">
              ATTENDANCE SESSIONS
            </h2>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            {sessions.length} Session{sessions.length === 1 ? '' : 's'} Configured
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0c0c16] border border-zinc-800 text-center space-y-3">
            <CalendarCheck className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-zinc-300">No Attendance Sessions Created</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Click "+ CREATE ATTENDANCE SESSION" above to initiate a check-in checkpoint.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map(session => {
              const stats = eventStore.getSessionStatistics(session.sessionId);
              const isActive = session.status === 'ACTIVE' || session.status === 'active';
              const isClosed = session.status === 'CLOSED' || session.status === 'closed';
              const isDraft = session.status === 'DRAFT' || session.status === 'draft';

              return (
                <div
                  key={session.sessionId}
                  className={`p-6 rounded-3xl border flex flex-col justify-between transition-all space-y-5 ${
                    isActive
                      ? 'bg-[#150d18] border-red-600/70 shadow-glow-crimson'
                      : 'bg-[#0c0c16] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-red-950 text-red-400 border border-red-800/60">
                        {session.sessionId}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isActive
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse'
                          : isClosed
                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
                      }`}>
                        {session.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white font-display">
                        {session.name || session.sessionName}
                      </h3>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">
                        {session.date} • {session.startTime} {session.endTime ? `- ${session.endTime}` : ''}
                      </div>
                      {session.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{session.description}</p>
                      )}
                    </div>

                    {/* Stats metrics block */}
                    <div className="p-3.5 rounded-2xl bg-[#10101e] border border-zinc-800/80 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[10px] font-mono text-zinc-400 uppercase">Present</div>
                        <div className="text-base font-bold text-emerald-400 font-mono">{stats.presentParticipants}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-zinc-400 uppercase">Absent</div>
                        <div className="text-base font-bold text-rose-400 font-mono">{stats.absentParticipants}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-zinc-400 uppercase">Rate</div>
                        <div className="text-base font-bold text-white font-mono">{stats.attendancePercentage}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions according to specs */}
                  <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                    {/* View Session is present for all non-draft or all sessions */}
                    <button
                      onClick={() => setActiveSessionId(session.sessionId)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-red-400" />
                      <span>VIEW SESSION</span>
                    </button>

                    {/* ACTIVE CONTROLS */}
                    {isActive && (
                      <button
                        onClick={() => setCloseConfirmSession(session)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-glow-crimson flex items-center space-x-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>CLOSE SESSION</span>
                      </button>
                    )}

                    {/* CLOSED CONTROLS */}
                    {isClosed && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => exportMemberLevelAttendance(session.sessionId)}
                          className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold uppercase"
                          title="Export CSV"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmSession(session)}
                          className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 text-xs font-semibold uppercase"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* DRAFT CONTROLS */}
                    {isDraft && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenSession(session)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1 shadow-glow-emerald"
                        >
                          <Play className="w-3 h-3" />
                          <span>OPEN</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(session)}
                          className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                          title="Edit Draft"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmSession(session)}
                          className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 text-xs font-semibold"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. CREATE ATTENDANCE SESSION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0e0e1a] border border-red-900/60 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-white font-display">CREATE ATTENDANCE SESSION</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                  Session Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Round 1 Attendance"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Milestone 1 Check-In & Evaluation Gate"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    placeholder="03/10/2026"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    placeholder="02:00 PM"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                    End Time (opt)
                  </label>
                  <input
                    type="text"
                    placeholder="03:00 PM"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-900/60 text-[11px] font-mono text-amber-300">
                Newly created sessions default to <strong>DRAFT</strong>. You can open the session when ready. Only ONE session can be ACTIVE at any time.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-glow-crimson"
                >
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DRAFT SESSION MODAL */}
      {isEditModalOpen && sessionToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0e0e1a] border border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white font-display">EDIT DRAFT SESSION</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                  Session Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE SESSION CONFIRMATION MODAL */}
      {closeConfirmSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0e0e1a] border border-rose-900/60 p-6 sm:p-8 space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center mx-auto text-rose-400">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-display">
                Close this attendance session?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Volunteers will no longer be able to submit attendance after this. Existing attendance data will remain permanently viewable in historical reports.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#121222] border border-zinc-800 text-xs font-mono text-zinc-300">
              Session: <strong className="text-white">{closeConfirmSession.name || closeConfirmSession.sessionName}</strong>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setCloseConfirmSession(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold uppercase"
              >
                Keep Active
              </button>
              <button
                onClick={handleConfirmCloseSession}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-glow-crimson"
              >
                Close Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SESSION CONFIRMATION MODAL */}
      {deleteConfirmSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#150a0e] border border-rose-800 p-6 sm:p-8 space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-950 border border-rose-700 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-display">
                Permanently Delete Session?
              </h3>
              <p className="text-xs text-rose-300/90 leading-relaxed font-sans">
                Deleting this session will permanently remove its attendance records. This action cannot be undone.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#200d14] border border-rose-900/60 text-xs font-mono text-zinc-300">
              Session: <strong className="text-white">{deleteConfirmSession.name || deleteConfirmSession.sessionName}</strong>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmSession(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteSession}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-glow-crimson"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
