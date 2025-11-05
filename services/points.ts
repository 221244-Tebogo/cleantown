import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, increment, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";


async function ensureUserDocExists(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      totalPoints: 0,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
}

/** Atomic award; creates the doc if missing; optionally bumps a counter (e.g., 'reports' or 'cleanups'). */
export async function awardPoints(uid: string, delta: number, opts?: { counterField?: "reports" | "cleanups" }) {
  if (!uid) throw new Error("awardPoints: uid required");
  if (!Number.isFinite(delta)) throw new Error("awardPoints: delta must be a number");

  const ref = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, {
        uid,
        totalPoints: 0,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
    const update: Record<string, any> = {
      totalPoints: increment(delta),
      lastPointsAt: serverTimestamp(),
      lastPointsDelta: delta,
    };
    if (opts?.counterField) update[opts.counterField] = increment(1);
    tx.set(ref, update, { merge: true });
  });
}

/** Simple wrapper kept for API compatibility with your code */
export async function bumpUserPoints(uid: string, delta = 2) {
  return awardPoints(uid, delta);
}

/** Legacy name kept for drop-in use */
export async function awardPointsTxn(uid: string, delta: number) {
  return awardPoints(uid, delta);
}

/** Ensure a user doc exists (call after login/registration) */
export async function ensurePointsInitialized(uid: string) {
  if (!uid) return;
  await ensureUserDocExists(uid);
}

/** Live hook for points */
export function useUserPoints(uid?: string | null): { points: number; loading: boolean } {
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(!!uid);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data() as any;
      setPoints(Number(d?.totalPoints ?? 0));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid]);

  return { points, loading };
}
