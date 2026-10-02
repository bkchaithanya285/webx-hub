export type UserRole = 'public' | 'admin' | 'team_lead' | 'volunteer' | 'reviewer';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin';
  active: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface TeamMember {
  memberId: string;
  teamId: string;
  name: string;
  registrationNumber: string;
  email: string;
  phone: string;
  isTeamLead: boolean;
  status: 'active' | 'inactive';
}

export interface Team {
  teamId: string; // e.g. "WEB-001" to "WEB-060"
  teamName: string;
  teamLeadMemberId: string;
  teamLeadAuthUid?: string;
  teamLeadRegNo: string; // Used for Team Lead Password Login
  status: 'registered' | 'verified' | 'disqualified';
  problemStatementId: string | null;
  problemSelectedAt: string | null;
  qrTokenHash: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
}

export interface ProblemStatement {
  problemStatementId: string; // e.g. "PS-01" to "PS-30"
  title: string;
  category: string;
  shortDescription: string;
  problem: string;
  background: string;
  objective: string;
  expectedSolution: string;
  technicalRequirements: string[];
  constraints: string[];
  expectedImpact: string;
  maximumTeams: number; // default: 2
  status: 'active' | 'closed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ProblemStatementAllocation {
  problemStatementId: string;
  maximumTeams: number;
  allocatedTeamIds: string[];
  currentTeamCount: number;
  updatedAt: string;
}

export type ReleaseState = 'NOT_RELEASED' | 'RELEASED';
export type SelectionState = 'CLOSED' | 'LOCKED' | 'UNLOCKED';
export type ProblemSelectionStatus = 'NOT_RELEASED' | 'RELEASED' | 'LOCKED' | 'UNLOCKED' | 'CLOSED' | 'DRAFT' | 'LIVE';

export interface ProblemSelectionRecord {
  teamId: string;
  teamName?: string;
  problemStatementId: string;
  psTitle?: string;
  selectedAt: string;
  selectedBy: string;
  active: boolean;
}

export interface SelectionSettings {
  releaseState?: ReleaseState;
  selectionState?: SelectionState;
  status: ProblemSelectionStatus; // mapped status for backward compatibility
  releaseAt?: string; // ISO string
  lockStartedAt?: string | null; // ISO string
  unlockAt?: string | null; // ISO string (countdown to automatic UNLOCKED transition)
  lockUntil?: string | null; // alias for unlockAt
  closeAt?: string | null; // ISO string
  updatedAt: string;
  updatedBy: string;
}

export interface AttendanceSession {
  sessionId: string;
  name: string;
  sessionName?: string; // alias for compatibility
  description?: string;
  date: string; // e.g. "03/10/2026" or "03 October 2026"
  startTime: string; // e.g. "02:00 PM"
  endTime?: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'draft' | 'active' | 'closed';
  createdAt: string;
  createdBy: string;
  openedAt: string | null;
  closedAt: string | null;
}

export interface AttendanceRecordMember {
  memberId: string;
  name: string;
  registrationNumber: string;
  status: 'PRESENT' | 'ABSENT';
  present?: boolean; // alias for compatibility
  markedAt: string;
  overrideReason?: string;
  overriddenBy?: string;
  overriddenAt?: string;
}

export interface AttendanceRecord {
  sessionId: string;
  teamId: string;
  submitted: boolean;
  submittedAt: string;
  submittedByVolunteerUid: string;
  volunteerName?: string;
  members: AttendanceRecordMember[];
  lastModifiedBy?: string;
}

export interface Volunteer {
  uid: string;
  email: string;
  name: string;
  active: boolean;
  createdAt: string;
  createdBy?: string;
}

export interface Reviewer {
  uid: string;
  email: string;
  name: string;
  active: boolean;
  allowedRounds: number[]; // e.g. [1, 2, 3]
  createdAt: string;
}

export interface ReviewSettings {
  activeRound: number; // 1, 2, 3
  round1Status: 'OPEN' | 'CLOSED';
  round2Status: 'OPEN' | 'CLOSED';
  round3Status: 'OPEN' | 'CLOSED';
  updatedAt: string;
  updatedBy: string;
}

export interface ReviewMarkRubric {
  innovation: number; // 0-25
  technicalFeasibility: number; // 0-25
  uiUxArchitecture: number; // 0-25
  presentationImpact: number; // 0-25
}

export interface ReviewMark {
  id: string; // round_team_reviewer
  round: number;
  teamId: string;
  reviewerUid: string;
  reviewerName: string;
  rawScore: number; // 0-100
  rubric?: ReviewMarkRubric;
  feedback?: string;
  submittedAt: string;
  status: 'draft' | 'submitted' | 'locked';
}

export interface NormalizedScore {
  id: string; // round_team_reviewer
  round: number;
  teamId: string;
  reviewerUid: string;
  rawScore: number;
  reviewerMean?: number;
  targetMean?: number;
  minimumReviewerScore: number;
  maximumReviewerScore: number;
  normalizedScore: number;
  calculatedAt: string;
  fallbackApplied?: boolean;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  problemStatementId: string | null;
  round1RawAvg: number;
  round1NormalizedAvg: number;
  round2RawAvg: number;
  round2NormalizedAvg: number;
  round3RawAvg: number;
  round3NormalizedAvg: number;
  totalScore: number; // calculated from normalized averages
  rank: number;
  updatedAt: string;
}

export interface DeviceSession {
  teamId: string;
  teamLeadAuthUid: string;
  sessionId: string;
  deviceId: string;
  deviceInfo: string;
  status: 'active' | 'revoked';
  createdAt: string;
  lastSeenAt: string;
  revokedAt?: string | null;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorUid: string;
  actorEmail?: string;
  actorRole: UserRole;
  action: string;
  targetType: 'team' | 'problem_statement' | 'selection' | 'attendance' | 'review' | 'session' | 'system';
  targetId: string;
  metadata: Record<string, any>;
}

export interface AppSettings {
  eventName: string;
  tagline: string;
  venue: string;
  date: string;
  credits: string;
  prizePool: string;
  prizes: {
    first: string;
    second: string;
    third: string;
  };
  landingPageEnabled: boolean;
  defaultMaxTeamsPerPS: number;
}
