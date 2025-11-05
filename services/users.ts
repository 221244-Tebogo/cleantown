// services/users.ts
import {
  doc,
  getDoc,
  increment,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

/** Ensure the current user's doc exists with totalPoints = 0 (if missing). */
export async function ensureUserDoc() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        uid,
        email: auth.currentUser?.email ?? null,
        displayName: auth.currentUser?.displayName ?? null,
        photoURL: auth.currentUser?.photoURL ?? null,
        totalPoints: 0, // ✅ satisfies your create rule
        createdAt: new Date(),
      },
      { merge: true }
    );
  } else if (typeof snap.data()?.totalPoints !== "number") {
    await setDoc(ref, { totalPoints: 0 }, { merge: true });
  }
}

/**
 * Award points to a user (+1 | +2 | +10 only).
 * Uses a transaction so it's safe if the doc is missing or multiple bumps happen quickly.
 * Complies with your rule: only 'totalPoints' changes on update.
 */
export async function awardPoints(uid: string, amount: 1 | 2 | 10) {
  const ref = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      // Create with 0 so the subsequent update passes "allowed delta" rules.
      tx.set(ref, { totalPoints: 0 });
    }
    // Only totalPoints changes here → passes your users update rule
    tx.update(ref, { totalPoints: increment(amount) });
  });
}

/** Convenience: award +2 to the currently signed-in user (e.g., on first join). */
export async function awardMyJoinPoints() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");
  return awardPoints(uid, 2);
}
