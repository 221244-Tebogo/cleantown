// services/points.ts
import { doc, increment, runTransaction } from "firebase/firestore";
import { db } from "../firebase";

export async function awardPoints(uid: string, delta: number) {
  const ref = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("User doc missing");
    tx.update(ref, { totalPoints: increment(delta) });
  });
}
