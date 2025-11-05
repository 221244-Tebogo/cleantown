import { getAuth } from "firebase/auth";
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export async function flagReportStillThere(reportId: string, still: boolean) {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error("Not signed in");

  const reportRef = doc(db, "reports", reportId);
  const voteRef = doc(db, "reports", reportId, "votes", uid);
  const GONE_CLOSE_THRESHOLD = 3;

  await runTransaction(db, async (tx) => {
    const voteSnap = await tx.get(voteRef);
    if (voteSnap.exists()) return; // already voted

    const reportSnap = await tx.get(reportRef);
    const data = reportSnap.data() || {};
    const notThereNow = (data.notThere ?? 0) + (still ? 0 : 1);

    // record the vote
    tx.set(voteRef, {
      uid,
      vote: still ? "still" : "gone",
      createdAt: serverTimestamp(),
    });

    // build minimal update to satisfy rules
    const update: any = { lastPingAt: serverTimestamp() };
    if (still) {
      update.stillThere = increment(1);
    } else {
      update.notThere = increment(1);
      if (
        (data.status ?? "open") === "open" &&
        notThereNow >= GONE_CLOSE_THRESHOLD
      ) {
        update.status = "closed"; // allowed path B3
      }
    }

    tx.update(reportRef, update);
  });
}
