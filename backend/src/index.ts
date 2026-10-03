import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID || "webx-hub";

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
      throw new functions.https.HttpsError("failed-precondition", "Problem statements have not been released yet.");
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
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Enable CORS and relaxed headers for Chrome DevTools and browser clients
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Chrome DevTools probe endpoint handler
app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({});
});

app.all("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.all("/robots.txt", (req, res) => {
  res.status(200).send("User-agent: *\nDisallow:");
});

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    platform: "WEBX COMMAND BACKEND ENGINE",
    endpoints: [
      "/health",
      "/attendance/active",
      "/leaderboard",
      "/api/createAttendanceSession",
      "/api/openAttendanceSession",
      "/api/closeAttendanceSession",
      "/api/submitAttendance",
      "/api/overrideMemberAttendance",
      "/api/submitReviewMarks",
      "/api/adminUpdateReviewMark",
      "/api/selectProblemStatement"
    ]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), platform: "WEBX COMMAND BACKEND" });
});

// Generic helper to extract data from req.body (handles standard REST and Firebase Callable { data: ... } formats)
function getReqData(req: express.Request) {
  return req.body && req.body.data !== undefined ? req.body.data : (req.body || {});
}

// 1. Attendance Endpoints
const handleCreateAttendance = async (req: express.Request, res: express.Response) => {
  try {
    const data = getReqData(req);
    const { name, description, date, startTime, endTime, adminEmail = "admin@klu.ac.in" } = data;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Session name is required.", data: null });
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
    return res.json({ result: { success: true, sessionId }, data: { success: true, sessionId } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

app.post(["/createAttendanceSession", "/api/createAttendanceSession", "/webx-hub/us-central1/createAttendanceSession"], handleCreateAttendance);

const handleOpenAttendance = async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = getReqData(req);
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }
    const sessionRef = db.doc(`attendanceSessions/${sessionId}`);
    await sessionRef.update({
      status: "ACTIVE",
      openedAt: admin.firestore.FieldValue.serverTimestamp(),
      closedAt: null
    });
    return res.json({ result: { success: true, sessionId }, data: { success: true, sessionId } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

app.post(["/openAttendanceSession", "/api/openAttendanceSession", "/webx-hub/us-central1/openAttendanceSession"], handleOpenAttendance);

const handleCloseAttendance = async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = getReqData(req);
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }
    const sessionRef = db.doc(`attendanceSessions/${sessionId}`);
    await sessionRef.update({
      status: "CLOSED",
      closedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return res.json({ result: { success: true, sessionId }, data: { success: true, sessionId } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

app.post(["/closeAttendanceSession", "/api/closeAttendanceSession", "/webx-hub/us-central1/closeAttendanceSession"], handleCloseAttendance);

const handleSubmitAttendance = async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId, teamId, memberEntries, volunteerName } = getReqData(req);
    if (!sessionId || !teamId || !memberEntries) {
      return res.status(400).json({ error: "Missing required attendance parameters." });
    }
    const recordKey = `${sessionId}_${teamId}`;
    const recordRef = db.doc(`attendanceRecords/${recordKey}`);
    const isoTime = new Date().toISOString();
    const membersPayload = (Array.isArray(memberEntries) ? memberEntries : Object.values(memberEntries)).map((m: any) => ({
      memberId: m.memberId,
      name: m.name,
      registrationNumber: m.registrationNumber,
      status: m.status || (m.present ? "PRESENT" : "ABSENT"),
      present: m.status === "PRESENT" || m.present === true,
      markedAt: isoTime
    }));

    await recordRef.set({
      sessionId,
      teamId,
      submitted: true,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      volunteerName: volunteerName || "Volunteer Marshal",
      members: membersPayload
    });
    return res.json({ result: { success: true, recordKey }, data: { success: true, recordKey } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

app.post(["/submitAttendance", "/api/submitAttendance", "/webx-hub/us-central1/submitAttendance"], handleSubmitAttendance);

app.get(["/attendance/active", "/api/attendance/active"], async (req, res) => {
  try {
    const snap = await db.collection("attendanceSessions").where("status", "==", "ACTIVE").limit(1).get();
    if (snap.empty) {
      return res.json({ active: false, session: null });
    }
    return res.json({ active: true, session: snap.docs[0].data() });
  } catch (err: any) {
    return res.json({ active: false, session: null, message: "No active session or offline mode" });
  }
});

// 2. Problem Statement Selection
const handleSelectProblem = async (req: express.Request, res: express.Response) => {
  try {
    const { teamId, problemStatementId, actorUid = "team_lead" } = getReqData(req);
    if (!teamId || !problemStatementId) {
      return res.status(400).json({ success: false, error: "Missing teamId or problemStatementId." });
    }

    const cleanId = teamId.trim().toUpperCase();
    const cleanPsId = problemStatementId.trim();
    const nowIso = new Date().toISOString();

    // 1. In-memory check first to fail fast if full
    const inMemAllocated = Object.values(backendProblemSelections).filter(
      (s: any) => s && s.active && s.problemStatementId === cleanPsId && s.teamId !== cleanId
    );
    if (inMemAllocated.length >= 2) {
      return res.status(409).json({
        success: false,
        error: "THIS PROBLEM STATEMENT IS NOW FULL. Maximum capacity of 2 teams reached."
      });
    }

    // 2. Authoritative Firestore Transaction with concurrency lock
    try {
      await db.runTransaction(async (transaction) => {
        // A. Check selection control & settings
        const controlDoc = await transaction.get(db.doc("problemSelectionControl/current"));
        const controlData = controlDoc.exists ? controlDoc.data()! : {};
        const selSettingsDoc = await transaction.get(db.doc("selectionSettings/current"));
        const selSettings = selSettingsDoc.exists ? selSettingsDoc.data()! : {};

        const combinedSettings = { ...backendSelectionSettings, ...controlData, ...selSettings };
        const now = Date.now();

        if (combinedSettings.releaseState === 'NOT_RELEASED' || combinedSettings.status === 'NOT_RELEASED' || combinedSettings.status === 'DRAFT') {
          throw new Error("Problem Statements have not been released yet.");
        }
        if (combinedSettings.selectionState === 'LOCKED' || combinedSettings.status === 'LOCKED') {
          throw new Error("Problem Statement Selection is currently locked.");
        }
        if (combinedSettings.selectionState === 'CLOSED' || combinedSettings.status === 'CLOSED') {
          throw new Error("Problem Statement selection is currently closed.");
        }
        if (combinedSettings.closeAt) {
          const closeTime = new Date(combinedSettings.closeAt).getTime();
          if (now >= closeTime) {
            throw new Error("Problem Statement selection window has closed.");
          }
        }

        // B. Validate Team
        const teamRef = db.doc(`teams/${cleanId}`);
        const teamDoc = await transaction.get(teamRef);
        if (teamDoc.exists) {
          const teamData = teamDoc.data()!;
          if (teamData.problemStatementId && teamData.problemStatementId !== cleanPsId) {
            throw new Error(`Team ${cleanId} has already selected problem statement ${teamData.problemStatementId}.`);
          }
        }

        // Check problemSelections
        const selRef = db.doc(`problemSelections/${cleanId}`);
        const selDoc = await transaction.get(selRef);
        if (selDoc.exists) {
          const selData = selDoc.data()!;
          if (selData.active && selData.problemStatementId && selData.problemStatementId !== cleanPsId) {
            throw new Error(`Team ${cleanId} has already selected problem statement ${selData.problemStatementId}.`);
          }
        }

        // C. Validate Problem Statement & Capacity Limit (Strict max 2)
        const psRef = db.doc(`problemStatements/${cleanPsId}`);
        const psDoc = await transaction.get(psRef);
        const psData = psDoc.exists ? psDoc.data()! : {};
        const maxCapacity = typeof psData.maximumTeams === 'number' ? psData.maximumTeams : 2;
        const psTitle = psData.title || cleanPsId;

        const allocRef = db.doc(`problemStatementAllocations/${cleanPsId}`);
        const allocDoc = await transaction.get(allocRef);
        const allocData = allocDoc.exists ? allocDoc.data()! : { currentTeamCount: 0, allocatedTeamIds: [] };

        const existingAllocated = (allocData.allocatedTeamIds || []).filter(
          (id: string) => id && id.toUpperCase() !== cleanId
        );

        if (existingAllocated.length >= maxCapacity) {
          throw new Error(`THIS PROBLEM STATEMENT IS NOW FULL. Maximum capacity of ${maxCapacity} teams reached.`);
        }

        const updatedAllocated = [...existingAllocated, cleanId];

        // Commit updates inside transaction
        transaction.set(allocRef, {
          problemStatementId: cleanPsId,
          maximumTeams: maxCapacity,
          currentTeamCount: updatedAllocated.length,
          allocatedTeamIds: updatedAllocated,
          updatedAt: nowIso
        }, { merge: true });

        transaction.set(selRef, {
          teamId: cleanId,
          teamName: (teamDoc.exists && teamDoc.data()?.teamName) || cleanId,
          problemStatementId: cleanPsId,
          psTitle: psTitle,
          selectedAt: nowIso,
          selectedBy: actorUid,
          active: true
        }, { merge: true });

        if (teamDoc.exists) {
          transaction.update(teamRef, {
            problemStatementId: cleanPsId,
            problemSelectedAt: nowIso,
            updatedAt: nowIso
          });
        } else {
          transaction.set(teamRef, {
            teamId: cleanId,
            problemStatementId: cleanPsId,
            problemSelectedAt: nowIso,
            updatedAt: nowIso
          }, { merge: true });
        }

        const auditRef = db.collection("auditLogs").doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          actorUid,
          actorName: `${cleanId} Lead`,
          actorRole: "team_lead",
          action: "PROBLEM_STATEMENT_SELECTED",
          targetType: "selection",
          targetId: cleanId,
          metadata: {
            teamId: cleanId,
            problemStatementId: cleanPsId,
            slotNumber: updatedAllocated.length,
            maxCapacity
          }
        });
      });
    } catch (txErr: any) {
      const isAuthOrCredError = txErr?.message && (
        txErr.message.includes("default credentials") ||
        txErr.message.includes("Could not load") ||
        txErr.message.includes("UNAUTHENTICATED") ||
        txErr.message.includes("offline")
      );

      if (isAuthOrCredError) {
        console.warn("[Backend Note] Running in standalone in-memory mode without ADC cloud credentials.");
      } else {
        console.warn("[Backend Selection Transaction Error]:", txErr?.message);
        return res.status(409).json({
          success: false,
          error: txErr.message || "Problem statement selection failed."
        });
      }
    }

    backendProblemSelections[cleanId] = {
      teamId: cleanId,
      problemStatementId: cleanPsId,
      selectedAt: nowIso,
      selectedBy: actorUid,
      active: true
    };

    return res.json({
      success: true,
      result: { success: true, teamId: cleanId, problemStatementId: cleanPsId },
      data: { success: true, teamId: cleanId, problemStatementId: cleanPsId }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error during problem selection."
    });
  }
};

app.post(["/selectProblemStatement", "/api/selectProblemStatement", "/webx-hub/us-central1/selectProblemStatement"], handleSelectProblem);

// In-memory backend fallback state for local cross-browser synchronization
let backendSelectionSettings: any = {
  releaseState: 'NOT_RELEASED',
  selectionState: 'CLOSED',
  status: 'NOT_RELEASED',
  releaseAt: null,
  lockStartedAt: null,
  lockUntil: null,
  unlockAt: null,
  closeAt: null,
  updatedAt: new Date().toISOString(),
  updatedBy: "System"
};

let backendProblemSelections: Record<string, any> = {};

let backendReviewers: any[] = [];
let backendVolunteers: any[] = [];

if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE || process.env.FIREBASE_CONFIG) {
  try {
    db.collection("volunteers").onSnapshot((snapshot) => {
      backendVolunteers = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    }, () => {});
  } catch (e) {}

  try {
    db.collection("reviewers").onSnapshot((snapshot) => {
      backendReviewers = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    }, () => {});
  } catch (e) {}
}

app.get(["/api/syncState", "/syncState", "/api/selectionSettings", "/selectionSettings"], async (req, res) => {
  try {
    const docSnap = await db.doc("problemSelectionControl/current").get();
    if (docSnap.exists) {
      backendSelectionSettings = { ...backendSelectionSettings, ...docSnap.data() };
    }
  } catch (e) {}
  return res.json({
    success: true,
    settings: backendSelectionSettings,
    problemSelections: backendProblemSelections,
    reviewers: backendReviewers,
    volunteers: backendVolunteers,
    timestamp: Date.now()
  });
});

app.post(["/api/selectionSettings", "/selectionSettings"], async (req, res) => {
  try {
    const data = getReqData(req);
    backendSelectionSettings = {
      ...backendSelectionSettings,
      ...data,
      updatedAt: new Date().toISOString()
    };
    try {
      await db.doc("problemSelectionControl/current").set(backendSelectionSettings, { merge: true });
    } catch (e) {}
    return res.json({ success: true, settings: backendSelectionSettings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(["/api/unselectProblem", "/unselectProblem"], async (req, res) => {
  try {
    const { teamId } = getReqData(req);
    if (teamId) {
      const cleanId = teamId.toUpperCase();
      delete backendProblemSelections[cleanId];
      delete backendProblemSelections[teamId];
      try {
        await db.doc(`problemSelections/${cleanId}`).delete();
        await db.doc(`teams/${cleanId}`).update({ problemStatementId: null, problemSelectedAt: null });
      } catch (e) {}
    }
    return res.json({ success: true, teamId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(["/api/adminAssignProblemStatement", "/adminAssignProblemStatement"], async (req, res) => {
  try {
    const { teamId, problemStatementId, adminEmail, actorUid } = getReqData(req);
    if (!teamId) {
      return res.status(400).json({ error: "Missing teamId" });
    }
    const cleanId = teamId.toUpperCase();
    const updatedAt = new Date().toISOString();

    if (problemStatementId) {
      const otherTeamsAllocated = Object.values(backendProblemSelections).filter(
        (s: any) => s.active && s.problemStatementId === problemStatementId && s.teamId !== cleanId && s.teamId !== teamId
      );
      if (otherTeamsAllocated.length >= 2) {
        return res.status(400).json({ error: `Problem Statement ${problemStatementId} is at maximum capacity (2/2 teams). Admin cannot assign.` });
      }

      backendProblemSelections[cleanId] = {
        teamId: cleanId,
        teamName: cleanId,
        problemStatementId,
        psTitle: problemStatementId,
        selectedAt: updatedAt,
        selectedBy: adminEmail || actorUid || "Admin",
        active: true
      };
      try {
        await db.doc(`teams/${cleanId}`).set({
          teamId: cleanId,
          problemStatementId,
          problemSelectedAt: updatedAt,
          updatedAt
        }, { merge: true });
        await db.doc(`problemSelections/${cleanId}`).set(backendProblemSelections[cleanId], { merge: true });
      } catch (e) {}
    } else {
      delete backendProblemSelections[cleanId];
      delete backendProblemSelections[teamId];
      try {
        await db.doc(`teams/${cleanId}`).update({
          problemStatementId: null,
          problemSelectedAt: null,
          updatedAt
        });
        await db.doc(`problemSelections/${cleanId}`).delete();
      } catch (e) {}
    }
    return res.json({ success: true, teamId: cleanId, problemStatementId, problemSelections: backendProblemSelections });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(["/api/resetAllProblemSelections", "/resetAllProblemSelections"], async (req, res) => {
  try {
    backendProblemSelections = {};
    return res.json({ success: true, message: "All problem selections cleared." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Reviewers management endpoints
app.post(["/api/addReviewer", "/addReviewer"], async (req, res) => {
  try {
    const { reviewer } = getReqData(req);
    if (!reviewer || !reviewer.uid) {
      return res.status(400).json({ error: "Missing reviewer data" });
    }
    const existingIdx = backendReviewers.findIndex(r => r.uid === reviewer.uid || r.email.toLowerCase() === reviewer.email.toLowerCase());
    if (existingIdx !== -1) {
      backendReviewers[existingIdx] = { ...backendReviewers[existingIdx], ...reviewer };
    } else {
      backendReviewers.push(reviewer);
    }
    try {
      await db.doc(`reviewers/${reviewer.uid}`).set(reviewer, { merge: true });
    } catch (e) {}
    return res.json({ success: true, reviewers: backendReviewers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(["/api/deleteReviewer", "/deleteReviewer"], async (req, res) => {
  try {
    const { revUid } = getReqData(req);
    if (!revUid) {
      return res.status(400).json({ error: "Missing revUid" });
    }
    backendReviewers = backendReviewers.filter(r => r.uid !== revUid);
    try {
      await db.doc(`reviewers/${revUid}`).delete();
    } catch (e) {}
    return res.json({ success: true, reviewers: backendReviewers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(["/api/toggleReviewerActive", "/toggleReviewerActive"], async (req, res) => {
  try {
    const { revUid, active } = getReqData(req);
    const rev = backendReviewers.find(r => r.uid === revUid);
    if (rev) {
      rev.active = typeof active === "boolean" ? active : !rev.active;
      try {
        await db.doc(`reviewers/${revUid}`).set({ active: rev.active }, { merge: true });
      } catch (e) {}
    }
    return res.json({ success: true, reviewers: backendReviewers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Volunteers management endpoints
app.post(["/api/addVolunteer", "/addVolunteer"], async (req, res) => {
  try {
    const { volunteer } = getReqData(req);
    if (!volunteer || !volunteer.uid) {
      return res.status(400).json({ error: "Missing volunteer data" });
    }
    const existingIdx = backendVolunteers.findIndex(v => v.uid === volunteer.uid || v.email.toLowerCase() === volunteer.email.toLowerCase());
    if (existingIdx !== -1) {
      backendVolunteers[existingIdx] = { ...backendVolunteers[existingIdx], ...volunteer };
    } else {
      backendVolunteers.push(volunteer);
    }
    try {
      await db.doc(`volunteers/${volunteer.uid}`).set(volunteer, { merge: true });
    } catch (e) {}
    return res.json({ success: true, volunteers: backendVolunteers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(["/api/deleteVolunteer", "/deleteVolunteer"], async (req, res) => {
  try {
    const { volUid } = getReqData(req);
    if (!volUid) {
      return res.status(400).json({ error: "Missing volUid" });
    }
    backendVolunteers = backendVolunteers.filter(v => v.uid !== volUid);
    try {
      await db.doc(`volunteers/${volUid}`).delete();
    } catch (e) {}
    return res.json({ success: true, volunteers: backendVolunteers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(["/api/toggleVolunteerActive", "/toggleVolunteerActive"], async (req, res) => {
  try {
    const { volUid, active } = getReqData(req);
    const vol = backendVolunteers.find(v => v.uid === volUid);
    if (vol) {
      vol.active = typeof active === "boolean" ? active : !vol.active;
      try {
        await db.doc(`volunteers/${volUid}`).set({ active: vol.active }, { merge: true });
      } catch (e) {}
    }
    return res.json({ success: true, volunteers: backendVolunteers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Catch-all route to prevent any 404 error on any path
app.use((req, res) => {
  res.status(200).json({
    status: "OK",
    handled: true,
    path: req.path,
    message: "WEBX COMMAND Backend Service endpoint ready"
  });
});

export const api = functions.https.onRequest(app);

const PORT = process.env.PORT || 5001;
if (!process.env.FUNCTION_NAME && !process.env.K_SERVICE) {
  app.listen(PORT, () => {
    console.log(`[WEBX COMMAND BACKEND] Server running on http://localhost:${PORT}`);
  });
}
