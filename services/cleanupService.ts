// services/cleanups.ts
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { awardPoints } from "./users"; // <-- NEW

const CLEANUPS = "cleanups";

// ---------- CREATE ----------
export async function createCleanup({
  title,
  when,
  description,
}: {
  title: string;
  when: string | Date;
  description?: string;
}) {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");

  let dateObj: Date;
  if (when instanceof Date) {
    dateObj = when;
  } else {
    const tryFull = new Date(when);
    dateObj = !isNaN(tryFull.getTime())
      ? tryFull
      : new Date(`${when}T00:00:00`);
  }
  if (isNaN(dateObj.getTime())) {
    throw new Error("Invalid date/time. Use YYYY-MM-DD or YYYY-MM-DD HH:mm");
  }
  const scheduledAt = Timestamp.fromDate(dateObj);

  const payload = {
    title: String(title ?? "").trim(),
    description: String(description ?? "").trim(),
    userId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    scheduledAt,
    status: "planned" as const,
  };

  const ref = await addDoc(collection(db, CLEANUPS), payload);
  return ref.id;
}

// ---------- LIST / SUBSCRIBE ----------
export function subscribeCleanups(setter: (items: any[]) => void) {
  const q = query(collection(db, CLEANUPS), orderBy("scheduledAt", "asc"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setter(items);
  });
}

// ---------- UPDATE ----------
export async function updateCleanup(
  id: string,
  patch: Partial<{
    title: string;
    scheduledAt: Date | string;
    status: "planned" | "completed" | "cancelled";
    description: string;
  }>
) {
  const data: any = { updatedAt: serverTimestamp() };
  if (typeof patch.title === "string") data.title = patch.title.trim();
  if (typeof patch.description === "string")
    data.description = patch.description.trim();
  if (patch.status) data.status = patch.status;
  if (patch.scheduledAt) {
    const dt =
      patch.scheduledAt instanceof Date
        ? patch.scheduledAt
        : new Date(patch.scheduledAt);
    if (isNaN(dt.getTime()))
      throw new Error("Invalid date/time for scheduledAt");
    data.scheduledAt = Timestamp.fromDate(dt);
  }
  await updateDoc(doc(db, CLEANUPS, id), data);
}

// ---------- DELETE ----------
export async function deleteCleanup(id: string) {
  await deleteDoc(doc(db, CLEANUPS, id));
}

// ---------- JOIN / LEAVE (awards points on first join) ----------
export async function joinCleanup(
  cleanupId: string,
  displayName?: string | null
) {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");

  const attendeeRef = doc(db, CLEANUPS, cleanupId, "attendees", uid);

  // Use a transaction to avoid race conditions (double-taps)
  const { firstJoin } = await runTransaction(db, async (tx) => {
    const snap = await tx.get(attendeeRef);
    if (!snap.exists()) {
      // Firestore rules require: joinedAt == request.time (serverTimestamp() is correct)
      tx.set(attendeeRef, {
        displayName: displayName ?? null,
        joinedAt: serverTimestamp(),
      });
      return { firstJoin: true };
    } else {
      tx.update(attendeeRef, { displayName: displayName ?? null });
      return { firstJoin: false };
    }
  });

  let addedPoints = 0;
  if (firstJoin) {
    try {
      // Your users rule allows +1 | +2 | +10 only.
      await awardPoints(uid, 2); // +2 for joining a cleanup
      addedPoints = 2;
    } catch (e) {
      // Keep silent if points bump fails; the join still stands.
      console.log("awardPoints(+2) failed:", (e as any)?.message || e);
    }
  }

  return { ok: true, addedPoints, firstJoin };
}

export async function leaveCleanup(cleanupId: string) {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");
  await deleteDoc(doc(db, CLEANUPS, cleanupId, "attendees", uid));
}
