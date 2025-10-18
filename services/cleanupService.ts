import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/** Fetch all cleanups once (sorted by scheduledAt ascending if present). */
export async function listCleanups() {
  const q = query(collection(db, "cleanups"), orderBy("scheduledAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Real-time subscription to cleanups; returns an unsubscribe function. */
export function subscribeCleanups(callback) {
  const q = query(collection(db, "cleanups"), orderBy("scheduledAt", "asc"));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(rows);
  });
}

/** Create a cleanup event. `when` can be a Date or ISO string. */
export async function createCleanup({ title, when, userId, description = "" }) {
  if (!title) throw new Error("Title is required.");

  const scheduledAt =
    when instanceof Date ? when : when ? new Date(when) : null;

  await addDoc(collection(db, "cleanups"), {
    title,
    description,
    status: "planned",
    scheduledAt,
    municipalityId: null,
    createdByUserId: userId || null,
    createdAt: serverTimestamp(),
  });
}
