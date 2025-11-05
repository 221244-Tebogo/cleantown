// functions/src/reports.ts
import { getFirestore } from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";

const db = getFirestore();
const REGION = defineString("REGION"); // optional, if you want

function assertMunicipal(ctx: any) {
  // Ensure the caller is authenticated and has a custom claim { role: "municipality" }
  if (!ctx.auth) throw new HttpsError("unauthenticated", "Sign in required.");
  const role = (ctx.auth.token as any)?.role;
  if (role !== "municipality")
    throw new HttpsError("permission-denied", "Municipal role required.");
}

export const updateReportStatus = onCall({ cors: true }, async (req) => {
  assertMunicipal(req);
  const { reportId, status } = req.data || {};
  if (!reportId || !status)
    throw new HttpsError(
      "invalid-argument",
      "reportId and status are required."
    );
  if (!["new", "acknowledged", "assigned", "resolved"].includes(status)) {
    throw new HttpsError("invalid-argument", "Invalid status.");
  }
  await db.collection("reports").doc(reportId).update({ status });
  return { ok: true };
});

export const assignReport = onCall({ cors: true }, async (req) => {
  assertMunicipal(req);
  const { reportId, officerUid } = req.data || {};
  if (!reportId || !officerUid)
    throw new HttpsError(
      "invalid-argument",
      "reportId and officerUid required."
    );
  await db
    .collection("reports")
    .doc(reportId)
    .update({ status: "assigned", assignedToUid: officerUid });
  return { ok: true };
});
