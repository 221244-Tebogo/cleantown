import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * One-time script to add missing fields to existing report docs.
 * Run this in dev mode or behind a protected button.
 */
export async function backfillReportsOnce() {
  const snap = await getDocs(collection(db, "reports"));
  console.log(`📝 Found ${snap.size} reports`);

  const updates = snap.docs.map(async (d) => {
    const data = d.data();
    await updateDoc(doc(db, "reports", d.id), {
      stillThere: data.stillThere ?? 0,
      lastPingAt: data.lastPingAt ?? null,
      priority: data.priority ?? 0,
    });
  });

  await Promise.all(updates);
  console.log("✅ Backfill completed!");
}
