import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "webx-hub";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: PROJECT_ID
    });
  } catch (e) {
    admin.initializeApp();
  }
}
const db = admin.firestore();

const ADMIN_EMAILS = [
  "bkrishnachaitanya285@gmail.com",
  "taruntej161413@gmail.com"
];

// Helper: Assert Admin Role
function assertAdmin(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const email = (context.auth.token.email || "").toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    throw new functions.https.HttpsError("permission-denied", "Unauthorized. Administrator access required.");
  }
  return email;
}

// ============================================================
// 1. ATTENDANCE BACKEND ENGINE
// ============================================================

/**
 * createAttendanceSession
 * Creates a new attendance session in DRAFT state
 */
export const createAttendanceSession = functions.https.onCall(async (data, context) => {
  const adminEmail = assertAdmin(context);
  const { name, description, date, startTime, endTime } = data;

  if (!name || !name.trim()) {
    throw new functions.https.HttpsError("invalid-argument", "Session name is required.");
  }

  const sessionsRef = db.collection("attendanceSessions");
  const countSnap = await sessionsRef.count().get();
  const sessionId = `SESSION_${(countSnap.data().count + 1).toString().padStart(3, "0")}`;

  const sessionDoc = {
    sessionId,
    name: name.trim(),
    description: (description || "").trim(),
    date: date || new Date().toLocaleDateString("en-GB"),
    startTime: startTime || "02:00 PM",
    endTime: (endTime || "").trim(),
    status: "DRAFT",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: adminEmail,
    openedAt: null,
    closedAt: null
  };

  await sessionsRef.doc(sessionId).set(sessionDoc);

  // Audit Log
  await db.collection("auditLogs").add({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    actorUid: context.auth!.uid,
    actorEmail: adminEmail,
    actorRole: "admin",
    action: "CREATE_ATTENDANCE_SESSION",
    targetType: "attendance",
    targetId: sessionId,
    metadata: { name, date, startTime, status: "DRAFT" }
  });

  return { success: true, sessionId };
});

/**
 * openAttendanceSession
 * Opens session (status = ACTIVE). Enforces maximum ONE active session rule on backend.
 */
export const openAttendanceSession = functions.https.onCall(async (data, context) => {
  const adminEmail = assertAdmin(context);
  const { sessionId } = data;

  if (!sessionId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing sessionId.");
  }

  return await db.runTransaction(async (transaction) => {
    // 1. Check if any OTHER session is active
    const activeQuery = db.collection("attendanceSessions").where("status", "==", "ACTIVE");
    const activeDocs = await transaction.get(activeQuery);

    const conflictingActive = activeDocs.docs.find(d => d.id !== sessionId);
    if (conflictingActive) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Another attendance session is currently active. Close the current session before opening another."
      );
    }

    const sessionRef = db.doc(`attendanceSessions/${sessionId}`);
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Session not found.");
    }

    transaction.update(sessionRef, {
      status: "ACTIVE",
      openedAt: admin.firestore.FieldValue.serverTimestamp(),
      closedAt: null
    });

    const auditRef = db.collection("auditLogs").doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      actorUid: context.auth!.uid,
      actorEmail: adminEmail,
      actorRole: "admin",
      action: "OPEN_ATTENDANCE_SESSION",
      targetType: "attendance",
      targetId: sessionId,
      metadata: { sessionName: sessionDoc.data()!.name, openedAt: new Date().toISOString() }
    });

    return { success: true, sessionId };
  });
});

/**
 * closeAttendanceSession
 * Closes session (status = CLOSED). Permanently disables volunteer submissions while preserving data.
 */
export const closeAttendanceSession = functions.https.onCall(async (data, context) => {
  const adminEmail = assertAdmin(context);
  const { sessionId } = data;

  const sessionRef = db.doc(`attendanceSessions/${sessionId}`);
  const doc = await sessionRef.get();
  if (!doc.exists) {
    throw new functions.https.HttpsError("not-found", "Session not found.");
  }

  await sessionRef.update({
    status: "CLOSED",
    closedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await db.collection("auditLogs").add({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    actorUid: context.auth!.uid,
    actorEmail: adminEmail,
    actorRole: "admin",
    action: "CLOSE_ATTENDANCE_SESSION",
    targetType: "attendance",
    targetId: sessionId,
    metadata: { sessionName: doc.data()!.name, closedAt: new Date().toISOString() }
  });

  return { success: true };
});

/**
 * submitAttendance
 * Volunteer submits attendance. Validates active session, authorized volunteer, team existence, and duplicate lock.
 */
export const submitAttendance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { sessionId, teamId, memberEntries, volunteerName } = data;
  if (!sessionId || !teamId || !memberEntries) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required attendance parameters.");
  }

  return await db.runTransaction(async (transaction) => {
    // 1. Verify session is ACTIVE
    const sessionRef = db.doc(`attendanceSessions/${sessionId}`);
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists || sessionDoc.data()!.status !== "ACTIVE") {
      throw new functions.https.HttpsError("failed-precondition", "Attendance session is not currently active.");
    }

    // 2. Verify team exists
    const teamRef = db.doc(`teams/${teamId}`);
    const teamDoc = await transaction.get(teamRef);
    if (!teamDoc.exists) {
      throw new functions.https.HttpsError("not-found", `Team ${teamId} does not exist in the registry.`);
    }

    // 3. Verify attendance has not already been submitted
    const recordKey = `${sessionId}_${teamId}`;
    const recordRef = db.doc(`attendanceRecords/${recordKey}`);
    const recordDoc = await transaction.get(recordRef);
    if (recordDoc.exists && recordDoc.data()!.submitted) {
      throw new functions.https.HttpsError("already-exists", `Attendance for Team ${teamId} has already been submitted and locked.`);
    }

    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
    const isoTime = new Date().toISOString();

    const membersPayload = (Array.isArray(memberEntries) ? memberEntries : Object.values(memberEntries)).map((m: any) => ({
      memberId: m.memberId,
      name: m.name,
      registrationNumber: m.registrationNumber,
      status: m.status || (m.present ? "PRESENT" : "ABSENT"),
      present: m.status === "PRESENT" || m.present === true,
      markedAt: isoTime
    }));

    transaction.set(recordRef, {
      sessionId,
      teamId,
      submitted: true,
      submittedAt: serverTimestamp,
      submittedByVolunteerUid: context.auth!.uid,
      volunteerName: volunteerName || context.auth!.token.name || "Volunteer Marshal",
      members: membersPayload
    });

    // Audit Log
    const auditRef = db.collection("auditLogs").doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      timestamp: serverTimestamp,
      actorUid: context.auth!.uid,
      actorEmail: context.auth!.token.email || "volunteer",
      actorRole: "volunteer",
      action: "SUBMIT_ATTENDANCE",
      targetType: "attendance",
      targetId: recordKey,
      metadata: { sessionId, teamId, presentCount: membersPayload.filter((m: any) => m.status === "PRESENT").length }
    });

    return { success: true, recordKey };
  });
});

/**
 * overrideMemberAttendance
 * Admin overrides member attendance with mandatory reason and immutable audit trail.
 */
export const overrideMemberAttendance = functions.https.onCall(async (data, context) => {
  const adminEmail = assertAdmin(context);
  const { sessionId, teamId, memberId, newStatus, reason } = data;

  if (!reason || !reason.trim()) {
    throw new functions.https.HttpsError("invalid-argument", "Reason for attendance override is strictly mandatory.");
  }
  if (!["PRESENT", "ABSENT"].includes(newStatus)) {
    throw new functions.https.HttpsError("invalid-argument", "Target status must be PRESENT or ABSENT.");
  }

  const recordKey = `${sessionId}_${teamId}`;
  const recordRef = db.doc(`attendanceRecords/${recordKey}`);
  const recordDoc = await recordRef.get();

  const nowIso = new Date().toISOString();

  if (recordDoc.exists) {
    const data = recordDoc.data()!;
    const members = data.members || [];
    let oldStatus = "NOT MARKED";

    const mem = members.find((m: any) => m.memberId === memberId);
    if (mem) {
      oldStatus = mem.status || (mem.present ? "PRESENT" : "ABSENT");
      mem.status = newStatus;
      mem.present = newStatus === "PRESENT";
      mem.overrideReason = reason.trim();
      mem.overriddenBy = adminEmail;
      mem.overriddenAt = nowIso;
    }

    await recordRef.update({
      members,
      lastModifiedBy: adminEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection("auditLogs").add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      actorUid: context.auth!.uid,
      actorEmail: adminEmail,
      actorRole: "admin",
      action: "ATTENDANCE_OVERRIDE",
      targetType: "attendance",
      targetId: `${recordKey}_${memberId}`,
      metadata: { sessionId, teamId, memberId, oldStatus, newStatus, reason: reason.trim(), changedBy: adminEmail }
    });
  }

  return { success: true };
});

// ============================================================
// 2. AUTOMATIC MIN-MAX NORMALIZATION ENGINE & REVIEWS
// ============================================================

/**
 * Helper: Recalculate Mean-Shift benchmark normalization for a specific round + reviewer
 */
async function autoRecalculateNormalization(round: number, reviewerUid: string) {
  const marksSnap = await db.collection("reviewMarks")
    .where("round", "==", round)
    .where("reviewerUid", "==", reviewerUid)
    .get();

  if (marksSnap.empty) return;

  const scores = marksSnap.docs.map(d => d.data().rawScore as number);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const sum = scores.reduce((a, b) => a + b, 0);
  const reviewerMean = sum / scores.length;
  const TARGET_MEAN = 75.0;
  const shift = TARGET_MEAN - reviewerMean;
  const nowIso = new Date().toISOString();

  const batch = db.batch();

  marksSnap.docs.forEach(doc => {
    const m = doc.data();
    // MEAN-SHIFT NORMALIZATION FORMULA:
    // Normalized = RawScore + (TargetMean - ReviewerMean), clamped to [0, 100]
    const shifted = (m.rawScore as number) + shift;
    const normalized = Math.min(100, Math.max(0, Math.round(shifted * 100) / 100));

    const normKey = `R${round}_${m.teamId}_${reviewerUid}`;
    const normRef = db.doc(`normalizedScores/${normKey}`);

    batch.set(normRef, {
      id: normKey,
      round,
      teamId: m.teamId,
      reviewerUid,
      rawScore: m.rawScore,
      reviewerMean: Math.round(reviewerMean * 100) / 100,
      targetMean: TARGET_MEAN,
      minimumReviewerScore: minScore,
      maximumReviewerScore: maxScore,
      normalizedScore: normalized,
      calculatedAt: nowIso,
      fallbackApplied: false
    });
  });

  await batch.commit();
}

/**
 * submitReviewMarks
 * Reviewer submits raw score. System automatically triggers Min-Max normalization recalculation.
 */
export const submitReviewMarks = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { round, teamId, rawScore, rubric, feedback } = data;
  if (typeof rawScore !== "number" || isNaN(rawScore) || rawScore < 0 || rawScore > 100) {
    throw new functions.https.HttpsError("invalid-argument", "Raw marks must be a number between 0 and 100.");
  }

  const reviewerUid = context.auth.uid;
  const reviewerName = context.auth.token.name || context.auth.token.email || "Reviewer";

  // Check round is OPEN
  const reviewSettingsDoc = await db.doc("reviewSettings/current").get();
  if (reviewSettingsDoc.exists) {
    const settings = reviewSettingsDoc.data()!;
    const statusKey = `round${round}Status`;
    if (settings[statusKey] !== "OPEN") {
      throw new functions.https.HttpsError("failed-precondition", `Round ${round} is currently CLOSED.`);
    }
  }

  const markKey = `R${round}_${teamId}_${reviewerUid}`;
  const markRef = db.doc(`reviewMarks/${markKey}`);

  await markRef.set({
    id: markKey,
    round,
    teamId,
    reviewerUid,
    reviewerName,
    rawScore,
    rubric: rubric || null,
    feedback: (feedback || "").trim(),
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "locked"
  });

  // AUTOMATIC MIN-MAX NORMALIZATION
  await autoRecalculateNormalization(round, reviewerUid);

  await db.collection("auditLogs").add({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    actorUid: reviewerUid,
    actorEmail: context.auth.token.email,
    actorRole: "reviewer",
    action: "SUBMIT_REVIEW_MARKS",
    targetType: "review",
    targetId: markKey,
    metadata: { round, teamId, rawScore }
  });

  return { success: true };
});

/**
 * adminUpdateReviewMark
 * Admin score correction with audit trail and automatic normalization update.
 */
export const adminUpdateReviewMark = functions.https.onCall(async (data, context) => {
  const adminEmail = assertAdmin(context);
  const { round, teamId, reviewerUid, newRawScore, reason } = data;

  if (!reason || !reason.trim()) {
    throw new functions.https.HttpsError("invalid-argument", "Reason for score change is strictly required.");
  }
  if (typeof newRawScore !== "number" || isNaN(newRawScore) || newRawScore < 0 || newRawScore > 100) {
    throw new functions.https.HttpsError("invalid-argument", "Marks must be between 0 and 100.");
  }

  const markKey = `R${round}_${teamId}_${reviewerUid}`;
  const markRef = db.doc(`reviewMarks/${markKey}`);
  const doc = await markRef.get();
  if (!doc.exists) {
    throw new functions.https.HttpsError("not-found", "Mark record not found.");
  }

  const oldRawScore = doc.data()!.rawScore;
  await markRef.update({
    rawScore: newRawScore,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // AUTOMATIC RECALCULATION
  await autoRecalculateNormalization(round, reviewerUid);

  await db.collection("auditLogs").add({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    actorUid: context.auth!.uid,
    actorEmail: adminEmail,
    actorRole: "admin",
    action: "ADMIN_SCORE_CORRECTION",
    targetType: "review",
    targetId: markKey,
    metadata: { round, teamId, reviewerUid, oldRawScore, newRawScore, reason: reason.trim(), changedBy: adminEmail }
  });

  return { success: true };
});

// ============================================================
// 3. ATOMIC PROBLEM STATEMENT SELECTION
// ============================================================

export const selectProblemStatement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { teamId, problemStatementId } = data;
  if (!teamId || !problemStatementId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing teamId or problemStatementId.");
  }

  const cleanTeamId = teamId.trim().toUpperCase();
  const cleanPsId = problemStatementId.trim();

  return await db.runTransaction(async (transaction) => {
    const serverTime = admin.firestore.Timestamp.now().toMillis();

    // 1. Validate Selection Settings & Timer
    const settingsDoc = await transaction.get(db.doc("selectionSettings/current"));
    const controlDoc = await transaction.get(db.doc("problemSelectionControl/current"));
    const settings = {
      ...(settingsDoc.exists ? settingsDoc.data()! : {}),
      ...(controlDoc.exists ? controlDoc.data()! : {})
    };

    if (settings.releaseState === "NOT_RELEASED" || settings.status === "NOT_RELEASED" || settings.status === "DRAFT") {
      throw new functions.https.HttpsError("failed-precondition", "Problem statement selection has not been released yet.");
    }
    if (settings.selectionState === "LOCKED" || settings.status === "LOCKED") {
      throw new functions.https.HttpsError("failed-precondition", "Problem statement selection is currently locked.");
    }
    if (settings.selectionState === "CLOSED" || settings.status === "CLOSED") {
      throw new functions.https.HttpsError("failed-precondition", "Problem statement selection window has concluded.");
    }
    if (settings.closeAt) {
      const closeAt = new Date(settings.closeAt).getTime();
      if (serverTime >= closeAt) {
        throw new functions.https.HttpsError("failed-precondition", "Problem statement selection window has concluded.");
      }
    }

    // 2. Validate Team
    const teamRef = db.doc(`teams/${cleanTeamId}`);
    const teamDoc = await transaction.get(teamRef);
    if (!teamDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Team not found.");
    }
    const teamData = teamDoc.data()!;
    if (teamData.problemStatementId && teamData.problemStatementId !== cleanPsId) {
      throw new functions.https.HttpsError("already-exists", `Team ${cleanTeamId} has already selected problem statement ${teamData.problemStatementId}.`);
    }
    if (teamData.problemStatementId === cleanPsId) {
      return { success: true, teamId: cleanTeamId, problemStatementId: cleanPsId, alreadySelected: true };
    }

    // 3. Validate Problem Statement & Strict Capacity Limit (Strict max 2)
    const psRef = db.doc(`problemStatements/${cleanPsId}`);
    const psDoc = await transaction.get(psRef);
    if (!psDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Problem statement not found.");
    }
    const psData = psDoc.data()!;
    const maxCapacity = typeof psData.maximumTeams === "number" ? psData.maximumTeams : 2;

    const allocRef = db.doc(`problemStatementAllocations/${cleanPsId}`);
    const allocDoc = await transaction.get(allocRef);
    const allocData = allocDoc.exists ? allocDoc.data()! : { currentTeamCount: 0, allocatedTeamIds: [] };

    const existingAllocated = (allocData.allocatedTeamIds || []).filter((id: string) => id && id.toUpperCase() !== cleanTeamId);

    if (existingAllocated.length >= maxCapacity) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        `THIS PROBLEM STATEMENT IS NOW FULL. Maximum capacity of ${maxCapacity} teams reached.`
      );
    }

    const nowIso = new Date(serverTime).toISOString();
    const updatedAllocated = [...existingAllocated, cleanTeamId];

    transaction.update(teamRef, {
      problemStatementId: cleanPsId,
      problemSelectedAt: nowIso,
      updatedAt: nowIso
    });

    transaction.set(db.doc(`problemSelections/${cleanTeamId}`), {
      teamId: cleanTeamId,
      teamName: teamData.teamName || cleanTeamId,
      problemStatementId: cleanPsId,
      psTitle: psData.title || cleanPsId,
      selectedAt: nowIso,
      selectedBy: context.auth!.uid,
      active: true
    }, { merge: true });

    transaction.set(allocRef, {
      problemStatementId: cleanPsId,
      maximumTeams: maxCapacity,
      currentTeamCount: updatedAllocated.length,
      allocatedTeamIds: updatedAllocated,
      updatedAt: nowIso
    }, { merge: true });

    const auditRef = db.collection("auditLogs").doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      timestamp: nowIso,
      actorUid: context.auth!.uid,
      actorRole: "team_lead",
      action: "PROBLEM_STATEMENT_SELECTED",
      targetType: "selection",
      targetId: cleanTeamId,
      metadata: { teamId: cleanTeamId, problemStatementId: cleanPsId, slotNumber: updatedAllocated.length, maxCapacity }
    });

    return { success: true, teamId: cleanTeamId, problemStatementId: cleanPsId };
  });
});

// ============================================================
// 4. STANDALONE EXPRESS REST API (FOR DIRECT REST CALLS)
// ============================================================

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), platform: "WEBX COMMAND BACKEND" });
});

app.get("/attendance/active", async (req, res) => {
  try {
    const snap = await db.collection("attendanceSessions").where("status", "==", "ACTIVE").limit(1).get();
    if (snap.empty) {
      return res.json({ active: false, session: null });
    }
    return res.json({ active: true, session: snap.docs[0].data() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/leaderboard", async (req, res) => {
  try {
    const snap = await db.collection("leaderboard").orderBy("totalScore", "desc").get();
    const data = snap.docs.map(d => d.data());
    return res.json({ leaderboard: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export const api = functions.https.onRequest(app);
