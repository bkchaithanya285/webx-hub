import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { eventStore } from './store';

/**
 * Backend API Client
 * Clean interface separating frontend components from backend server-side implementations.
 * Integrates with Firebase Cloud Functions with automatic store engine resolution.
 */
export const backendApi = {
  // 1. ATTENDANCE BACKEND SERVICES
  attendance: {
    async createSession(name: string, description?: string, date?: string, startTime?: string, endTime?: string, adminUid = 'admin', adminEmail = 'admin@klu.ac.in') {
      try {
        const callable = httpsCallable(functions, 'createAttendanceSession');
        const res = await callable({ name, description, date, startTime, endTime });
        return res.data;
      } catch (err) {
        // Fallback to local store engine
        return eventStore.createAttendanceSession(adminUid, adminEmail, { name, description, date: date || '', startTime: startTime || '', endTime });
      }
    },

    async openSession(sessionId: string, adminUid = 'admin', adminEmail = 'admin@klu.ac.in') {
      try {
        const callable = httpsCallable(functions, 'openAttendanceSession');
        const res = await callable({ sessionId });
        return res.data;
      } catch (err) {
        return eventStore.openAttendanceSession(adminUid, adminEmail, sessionId);
      }
    },

    async closeSession(sessionId: string, adminUid = 'admin', adminEmail = 'admin@klu.ac.in') {
      try {
        const callable = httpsCallable(functions, 'closeAttendanceSession');
        const res = await callable({ sessionId });
        return res.data;
      } catch (err) {
        return eventStore.closeAttendanceSession(adminUid, adminEmail, sessionId);
      }
    },

    async submitAttendance(volunteerUid: string, volunteerName: string, sessionId: string, teamId: string, memberEntries: any) {
      try {
        const callable = httpsCallable(functions, 'submitAttendance');
        const res = await callable({ sessionId, teamId, memberEntries, volunteerName });
        return res.data;
      } catch (err) {
        return eventStore.submitAttendance(volunteerUid, volunteerName, sessionId, teamId, memberEntries);
      }
    },

    async overrideAttendance(sessionId: string, teamId: string, memberId: string, newStatus: 'PRESENT' | 'ABSENT', reason: string, adminUid = 'admin', adminEmail = 'admin@klu.ac.in') {
      try {
        const callable = httpsCallable(functions, 'overrideMemberAttendance');
        const res = await callable({ sessionId, teamId, memberId, newStatus, reason });
        return res.data;
      } catch (err) {
        return eventStore.overrideMemberAttendance(adminUid, adminEmail, sessionId, teamId, memberId, newStatus, reason);
      }
    }
  },

  // 2. REVIEWS & AUTOMATIC NORMALIZATION BACKEND SERVICES
  reviews: {
    async submitMarks(reviewerUid: string, reviewerName: string, round: number, teamId: string, rawScore: number, rubric?: any, feedback?: string, memberScores?: any) {
      try {
        const callable = httpsCallable(functions, 'submitReviewMarks');
        const res = await callable({ round, teamId, rawScore, rubric, feedback, memberScores });
        return res.data;
      } catch (err) {
        return eventStore.submitReviewMarks(reviewerUid, reviewerName, round, teamId, rawScore, rubric, feedback, memberScores);
      }
    },

    async adminScoreCorrection(round: number, teamId: string, reviewerUid: string, newRawScore: number, reason: string, adminUid = 'admin', adminEmail = 'admin@klu.ac.in') {
      try {
        const callable = httpsCallable(functions, 'adminUpdateReviewMark');
        const res = await callable({ round, teamId, reviewerUid, newRawScore, reason });
        return res.data;
      } catch (err) {
        return eventStore.adminUpdateReviewMark(adminUid, adminEmail, round, teamId, reviewerUid, newRawScore, reason);
      }
    },

    async openRound(round: 1 | 2 | 3, adminUid = 'admin', adminEmail = 'admin@klu.ac.in') {
      eventStore.openReviewRound(adminUid, adminEmail, round);
    },

    async closeRound(round: 1 | 2 | 3, adminUid = 'admin', adminEmail = 'admin@klu.ac.in') {
      eventStore.closeReviewRound(adminUid, adminEmail, round);
    }
  },

  // 3. PROBLEM STATEMENT SELECTION ATOMIC TRANSACTION
  selection: {
    async selectProblem(teamId: string, problemStatementId: string, actorUid: string) {
      try {
        const callable = httpsCallable(functions, 'selectProblemStatement');
        const res = await callable({ teamId, problemStatementId });
        return res.data;
      } catch (err) {
        return await eventStore.selectProblemStatement(teamId, problemStatementId, actorUid);
      }
    }
  }
};
