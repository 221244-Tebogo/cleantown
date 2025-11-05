import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Seeds counters/meta fields on existing reports (JS version).
 */
export async function backfillReportsOnce() {
  const snap = await getDocs(collection(db, "reports"));

  const updates = snap.docs.map(async (d) => {
    const data = d.data() || {};
    await updateDoc(doc(db, "reports", d.id), {
      stillThere: typeof data.stillThere === "number" ? data.stillThere : 0,
      notThere: typeof data.notThere === "number" ? data.notThere : 0,
      lastPingAt: Object.prototype.hasOwnProperty.call(data, "lastPingAt")
        ? data.lastPingAt
        : null,
      priority: typeof data.priority === "number" ? data.priority : 0,
    });
  });

  await Promise.all(updates);
  console.log("✅ backfillReportsOnce done");
}
