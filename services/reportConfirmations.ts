// services/reportConfirmations.ts (was reportVotes.ts)
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { awardPoints } from "./points";

export async function confirmReport(reportId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const voteRef = doc(db, "reports", reportId, "votes", uid);
  const reportRef = doc(db, "reports", reportId);

  let reporterUid = "";
  await runTransaction(db, async (tx) => {
    const prev = await tx.get(voteRef);
    const rep = await tx.get(reportRef);
    reporterUid = (rep.data()?.uid as string) ?? "";
    if (!prev.exists() || prev.data().type !== "confirm") {
      tx.set(voteRef, { type: "confirm", ts: serverTimestamp() });
      tx.update(reportRef, {
        confirmations: increment(1),
        lastConfirmedAt: serverTimestamp(),
        status: "open",
      });
    }
  });

  // points outside the tx (simple and fine for MVP)
  await awardPoints(uid, 2); // 🟢 voter gets +2
  if (reporterUid) await awardPoints(reporterUid, 1); // optional: reporter +1 per confirmation
}

export async function dismissReport(reportId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const voteRef = doc(db, "reports", reportId, "votes", uid);
  const reportRef = doc(db, "reports", reportId);

  await runTransaction(db, async (tx) => {
    const prev = await tx.get(voteRef);
    if (!prev.exists() || prev.data().type !== "dismiss") {
      tx.set(voteRef, { type: "dismiss", ts: serverTimestamp() });
      tx.update(reportRef, {
        dismissals: increment(1),
        status: "maybe_gone",
      });
    }
  });

  await awardPoints(uid, 1);
}
