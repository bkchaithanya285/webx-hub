import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Team, Reviewer } from '../types';
import { eventStore } from '../services/store';

export interface CurrentUser {
  role: UserRole;
  uid: string;
  email?: string;
  name: string;
  teamId?: string; // For team leads
  teamData?: Team;
  reviewerData?: Reviewer;
  deviceId?: string;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  loginAsAdmin: (email: string, name?: string) => { success: boolean; error?: string };
  loginAsTeamLead: (teamId: string, regNo: string) => { success: boolean; error?: string };
  loginAsVolunteer: (volunteerName: string, accessPin?: string) => { success: boolean; error?: string };
  loginAsReviewer: (email: string, name?: string) => { success: boolean; error?: string };
  logout: () => void;
  switchRoleQuick: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_ALLOWLIST = [
  "bkrishnachaitanya285@gmail.com",
  "taruntej161413@gmail.com"
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem('webx_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('webx_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('webx_current_user');
    }
  }, [currentUser]);

  // Generate or retrieve persistent browser deviceId
  const getOrCreateDeviceId = (): string => {
    let devId = localStorage.getItem('webx_device_id');
    if (!devId) {
      devId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('webx_device_id', devId);
    }
    return devId;
  };

  const loginAsAdmin = (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isAllowed = ADMIN_ALLOWLIST.some(e => e.toLowerCase() === cleanEmail);

    if (!isAllowed) {
      return {
        success: false,
        error: `Access Denied. Email "${email}" is not authorized for WEBX Admin Command access.`
      };
    }

    const user: CurrentUser = {
      role: 'admin',
      uid: cleanEmail.includes('krishna') ? 'admin-1' : 'admin-2',
      email: cleanEmail,
      name: name || (cleanEmail.includes('krishna') ? 'Krishna Chaitanya (Admin)' : 'Tarun Tej (Admin)')
    };

    setCurrentUser(user);
    eventStore.addAuditLog(user.uid, user.email, 'admin', 'ADMIN_LOGIN', 'system', 'AUTH', { email: cleanEmail });
    return { success: true };
  };

  const loginAsTeamLead = (rawTeamId: string, rawRegNo: string) => {
    const rawId = rawTeamId.trim().toUpperCase();
    const regNo = rawRegNo.trim();

    const team = eventStore.getTeam(rawId);
    if (!team) {
      return { success: false, error: `Team ID "${rawId}" not found in WEBX registry. Use format: WEB-001 to WEB-060.` };
    }

    const teamId = team.teamId;

    // Check registration number password
    if (team.teamLeadRegNo !== regNo) {
      return { success: false, error: "Invalid password. Password must be the Team Lead's Registration Number." };
    }

    // Verify Single Device Session
    const deviceId = getOrCreateDeviceId();
    const deviceInfo = `${navigator.userAgent.slice(0, 45)}...`;
    const deviceCheck = eventStore.verifyOrRegisterDeviceSession(teamId, deviceId, deviceInfo);

    if (!deviceCheck.allowed) {
      return {
        success: false,
        error: deviceCheck.message || "THIS TEAM ACCOUNT IS ALREADY ACTIVE ON ANOTHER DEVICE. Please contact the WEBX Command administrator."
      };
    }

    const leadMember = team.members.find(m => m.isTeamLead) || team.members[0];

    const user: CurrentUser = {
      role: 'team_lead',
      uid: leadMember.memberId,
      email: leadMember.email,
      name: leadMember.name,
      teamId: team.teamId,
      teamData: team,
      deviceId
    };

    setCurrentUser(user);
    eventStore.addAuditLog(leadMember.memberId, leadMember.email, 'team_lead', 'TEAM_LEAD_LOGIN', 'team', teamId, { deviceId });
    return { success: true };
  };

  const loginAsVolunteer = (emailOrName: string, accessPin?: string) => {
    const cleanEmail = emailOrName.trim().toLowerCase();
    const volunteers = eventStore.getVolunteers();
    
    // Check by email in allowlist first
    const volunteer = volunteers.find(v => v.email.toLowerCase() === cleanEmail && v.active);

    if (volunteer) {
      const user: CurrentUser = {
        role: 'volunteer',
        uid: volunteer.uid,
        email: volunteer.email,
        name: volunteer.name
      };
      setCurrentUser(user);
      eventStore.addAuditLog(user.uid, user.email, 'volunteer', 'VOLUNTEER_LOGIN', 'attendance', 'VOLUNTEER_PORTAL', { volunteerName: user.name });
      return { success: true };
    }

    // If Admin email, allow immediate marshal scanning access
    const isAdmin = ADMIN_ALLOWLIST.some(a => a.toLowerCase() === cleanEmail);
    if (isAdmin) {
      const adminVolName = cleanEmail.includes("krishna") ? "Krishna Chaitanya (Admin Marshal)" : "Tarun Tej (Admin Marshal)";
      const user: CurrentUser = {
        role: 'volunteer',
        uid: cleanEmail.includes("krishna") ? "admin-1" : "admin-2",
        email: cleanEmail,
        name: adminVolName
      };
      setCurrentUser(user);
      eventStore.addAuditLog(user.uid, user.email, 'volunteer', 'VOLUNTEER_LOGIN', 'attendance', 'VOLUNTEER_PORTAL', { volunteerName: user.name, isAdminMarshal: true });
      return { success: true };
    }

    // Support PIN / fast name access fallback
    const validPin = "1234";

    if (accessPin && (accessPin.trim() === validPin || accessPin.trim() === "WEBX2026" || accessPin.trim() === "1234")) {
      const uid = `vol-${Date.now().toString().slice(-4)}`;
      const user: CurrentUser = {
        role: 'volunteer',
        uid,
        name: emailOrName.trim() || "WEBX Volunteer Squad"
      };

      setCurrentUser(user);
      eventStore.addAuditLog(uid, undefined, 'volunteer', 'VOLUNTEER_LOGIN', 'attendance', 'VOLUNTEER_PORTAL', { volunteerName: user.name });
      return { success: true };
    }

    return {
      success: false,
      error: `Volunteer account "${emailOrName}" is not authorized or is inactive. Contact Admin to register.`
    };
  };

  const loginAsReviewer = (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If Admin email, grant immediate Super Jury / Reviewer access
    const isAdmin = ADMIN_ALLOWLIST.some(a => a.toLowerCase() === cleanEmail);
    if (isAdmin) {
      const adminName = name || (cleanEmail.includes("krishna") ? "Krishna Chaitanya (Admin Jury)" : "Tarun Tej (Admin Jury)");
      const adminReviewerData: Reviewer = {
        uid: cleanEmail.includes("krishna") ? "admin-1" : "admin-2",
        email: cleanEmail,
        name: adminName,
        active: true,
        allowedRounds: [1, 2, 3],
        createdAt: new Date().toISOString()
      };

      const user: CurrentUser = {
        role: 'reviewer',
        uid: adminReviewerData.uid,
        email: cleanEmail,
        name: adminName,
        reviewerData: adminReviewerData
      };

      setCurrentUser(user);
      eventStore.addAuditLog(user.uid, user.email, 'reviewer', 'REVIEWER_LOGIN', 'review', user.uid, { name: user.name, isAdminJury: true });
      return { success: true };
    }

    // 2. Check registered jury reviewers
    const reviewers = eventStore.getReviewers();
    const reviewer = reviewers.find(r => r.email.trim().toLowerCase() === cleanEmail);

    if (!reviewer) {
      return {
        success: false,
        error: `Reviewer account "${email}" is not registered in the WEBX Reviewers registry. Please have the Admin add "${cleanEmail}" under Admin > Reviewers Jury.`
      };
    }

    if (!reviewer.active) {
      return {
        success: false,
        error: `Reviewer account "${email}" is currently INACTIVE. Contact Admin to activate.`
      };
    }

    const user: CurrentUser = {
      role: 'reviewer',
      uid: reviewer.uid,
      email: reviewer.email,
      name: name || reviewer.name,
      reviewerData: reviewer
    };

    setCurrentUser(user);
    eventStore.addAuditLog(reviewer.uid, reviewer.email, 'reviewer', 'REVIEWER_LOGIN', 'review', reviewer.uid, { name: user.name });
    return { success: true };
  };

  const switchRoleQuick = (role: UserRole) => {
    if (role === 'public') {
      logout();
      return;
    }
    if (role === 'admin') {
      loginAsAdmin("bkrishnachaitanya285@gmail.com");
    } else if (role === 'team_lead') {
      loginAsTeamLead("WEB-001", "9922004001");
    } else if (role === 'volunteer') {
      loginAsVolunteer("Aditya (Lead Volunteer)", "1234");
    } else if (role === 'reviewer') {
      loginAsReviewer("dr.ramesh.cse@kare.ac.in");
    }
  };

  const logout = () => {
    if (currentUser) {
      eventStore.addAuditLog(currentUser.uid, currentUser.email, currentUser.role, 'LOGOUT', 'system', 'AUTH', {});
    }
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loginAsAdmin,
        loginAsTeamLead,
        loginAsVolunteer,
        loginAsReviewer,
        logout,
        switchRoleQuick
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
