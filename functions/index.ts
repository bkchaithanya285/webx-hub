import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const ADMIN_EMAILS = [
  "bkrishnachaitanya285@gmail.com",
  "taruntej161413@gmail.com"
];

/**
 * 1. selectProblemStatement
 * Atomic Problem Statement Selection with server-side time and capacity validation
 */
export const selectProblemStatement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { teamId, problemStatementId } = data;
  if (!teamId || !problemStatementId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing teamId or problemStatementId.");
  }

  return await db.runTransaction(async (transaction) => {
    const serverTime = admin.firestore.Timestamp.now().toMillis();

    // 1. Check selectionSettings
    const settingsDoc = await transaction.get(db.doc("selectionSettings/current"));
    if (!settingsDoc.exists) {
      throw new functions.https.HttpsError("failed-precondition", "Selection settings not initialized.");
    }
    const settings = settingsDoc.data()!;
    const releaseAt = new Date(settings.releaseAt).getTime();
    const closeAt = new Date(settings.closeAt).getTime();

    if (settings.status !== "LIVE" || serverTime < releaseAt) {
      throw new functions.https.HttpsError("failed-precondition", "Problem statement selection is not currently open.");
    }
    if (serverTime >= closeAt) {
      throw new functions.https.HttpsError("failed-precondition", "Problem statement selection window has concluded.");
    }

    // 2. Check team
    const teamRef = db.doc(`teams/${teamId}`);
    const teamDoc = await transaction.get(teamRef);
    if (!teamDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Team not found.");
    }
    const teamData = teamDoc.data()!;
    if (teamData.problemStatementId) {
      throw new functions.https.HttpsError("already-exists", `Team ${teamId} has already selected a problem statement.`);
    }

    // 3. Check problem statement & capacity
    const psRef = db.doc(`problemStatements/${problemStatementId}`);
    const psDoc = await transaction.get(psRef);
    if (!psDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Problem statement not found.");
    }
    const psData = psDoc.data()!;
    const maxCapacity = psData.maximumTeams || 2;

    const allocRef = db.doc(`problemStatementAllocations/${problemStatementId}`);
    const allocDoc = await transaction.get(allocRef);
    const allocData = allocDoc.exists ? allocDoc.data()! : { currentTeamCount: 0, allocatedTeamIds: [] };

    if (allocData.currentTeamCount >= maxCapacity) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "THIS PROBLEM STATEMENT IS NOW FULL. Please select another available problem statement."
      );
    }

    // 4. Commit atomic updates
    const nowIso = new Date(serverTime).toISOString();
    
    // Update problemSelections
    transaction.set(db.doc(`problemSelections/${teamId}`), {
      teamId,
      problemStatementId,
      selectedAt: nowIso,
      selectedByUid: context.auth!.uid,
      selectionMethod: "PORTAL_TRANSACTION",
      active: true
    });

    // Update team
    transaction.update(teamRef, {
      problemStatementId,
      problemSelectedAt: nowIso,
      updatedAt: nowIso
    });

    // Update allocation
    transaction.set(allocRef, {
      problemStatementId,
      maximumTeams: maxCapacity,
      currentTeamCount: allocData.currentTeamCount + 1,
      allocatedTeamIds: [...allocData.allocatedTeamIds, teamId],
      updatedAt: nowIso
    }, { merge: true });

    // Create Audit Log
    const auditRef = db.collection("auditLogs").doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      timestamp: nowIso,
      actorUid: context.auth!.uid,
      actorRole: "team_lead",
      action: "PROBLEM_STATEMENT_SELECTED",
      targetType: "selection",
      targetId: teamId,
      metadata: { teamId, problemStatementId, slotNumber: allocData.currentTeamCount + 1 }
    });

    return { success: true, teamId, problemStatementId };
  });
});

/**
 * 2. normalizeRoundScores
 * Calculate reviewer-level min-max normalization after round closure
 */
export const normalizeRoundScores = functions.https.onCall(async (data, context) => {
  if (!context.auth || !ADMIN_EMAILS.includes(context.auth.token.email || "")) {
    throw new functions.https.HttpsError("permission-denied", "Only authorized administrators can run normalization.");
  }

  const { round } = data;
  if (!round || ![1, 2, 3].includes(round)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid round number.");
  }

  const marksSnap = await db.collection("reviewMarks").where("round", "==", round).get();
  if (marksSnap.empty) {
    return { success: false, message: "No marks found for this round." };
  }

  // Group by reviewerUid
  const reviewerGroups: Record<string, any[]> = {};
  marksSnap.docs.forEach((doc) => {
    const m = doc.data();
    if (!reviewerGroups[m.reviewerUid]) reviewerGroups[m.reviewerUid] = [];
    reviewerGroups[m.reviewerUid].push(m);
  });

  const batch = db.batch();
  let count = 0;

  for (const [revUid, marks] of Object.entries(reviewerGroups)) {
    const scores = marks.map((m) => m.rawScore);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const sum = scores.reduce((a, b) => a + b, 0);
    const reviewerMean = sum / scores.length;
    const TARGET_MEAN = 75.0;
    const shift = TARGET_MEAN - reviewerMean;

    for (const m of marks) {
      const shifted = m.rawScore + shift;
      const normalized = Math.min(100, Math.max(0, Math.round(shifted * 100) / 100));

      const normKey = `R${round}_${m.teamId}_${revUid}`;
      const normRef = db.doc(`normalizedScores/${normKey}`);
      batch.set(normRef, {
        id: normKey,
        round,
        teamId: m.teamId,
        reviewerUid: revUid,
        rawScore: m.rawScore,
        reviewerMean: Math.round(reviewerMean * 100) / 100,
        targetMean: TARGET_MEAN,
        minimumReviewerScore: minScore,
        maximumReviewerScore: maxScore,
        normalizedScore: normalized,
        calculatedAt: new Date().toISOString(),
        fallbackApplied: false
      });
      count++;
    }
  }

  await batch.commit();
  return { success: true, count, round };
});
