import { doc, increment, runTransaction, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function bumpUserPoints(uid: string, delta = 2) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { totalPoints: increment(delta) });
}

export async function awardPointsTxn(uid: string, delta: number) {
  const ref = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      throw new Error(
        "User doc missing (create it at signup with totalPoints: 0)."
      );
    }
    tx.update(ref, { totalPoints: increment(delta) });
  });
}
