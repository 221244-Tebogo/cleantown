import { doc, getDoc, increment, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

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
        totalPoints: 0,
        createdAt: new Date(),
      },
      { merge: true }
    );
  } else if (typeof snap.data()?.totalPoints !== "number") {
    await setDoc(ref, { totalPoints: 0 }, { merge: true });
  }
}

// award points:
export async function awardPoints(uid: string, amount: 1 | 2 | 10) {
  await updateDoc(doc(db, "users", uid), { totalPoints: increment(amount) });
}
