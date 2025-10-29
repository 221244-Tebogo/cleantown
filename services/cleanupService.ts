import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase"; // ← your single firebase module

const CLEANUPS = "cleanups";

// ---------- CREATE (service pulls auth uid) ----------
export async function createCleanup({
  title,
  when, // Date | "YYYY-MM-DD" | "YYYY-MM-DD HH:mm"
  description, // optional
}: {
  title: string;
  when: string | Date;
  description?: string;
}) {
  const uid = getAuth().currentUser?.uid;
  if (!uid) {
    console.log("[createCleanup] No auth user found");
    throw new Error("Not signed in.");
  }

  // Parse to Date → Firestore Timestamp
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
    console.log("[createCleanup] Invalid date input:", when);
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

  console.log("[createCleanup] payload", payload);
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

// ---------- JOIN / LEAVE ----------
export async function joinCleanup(
  cleanupId: string,
  displayName?: string | null
) {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");
  const attendeeRef = doc(db, CLEANUPS, cleanupId, "attendees", uid);
  const exists = (await getDoc(attendeeRef)).exists();

  if (!exists) {
    await setDoc(attendeeRef, {
      displayName: displayName ?? null,
      joinedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(attendeeRef, { displayName: displayName ?? null });
  }
}

export async function leaveCleanup(cleanupId: string) {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");
  await deleteDoc(doc(db, CLEANUPS, cleanupId, "attendees", uid));
}
