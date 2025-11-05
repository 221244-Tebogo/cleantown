import { auth, db, storage } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

function userColl() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return collection(db, "users", uid, "recordings");
}

export async function saveRecordingMeta(params: {
  url: string;
  path: string;
  durationMs?: number;
  sizeBytes?: number;
}) {
  const coll = userColl();
  const docRef = await addDoc(coll, {
    ...params,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** List current user's recordings (newest first) */
export async function listMyRecordings() {
  const coll = userColl();
  const q = query(coll, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
}

/** Optional: update metadata (e.g., rename) */
export async function updateMyRecording(
  id: string,
  data: Partial<{ title: string }>
) {
  const uid = auth.currentUser?.uid!;
  await updateDoc(doc(db, "users", uid, "recordings", id), data);
  return true;
}

/** Delete Storage object then Firestore doc */
export async function deleteMyRecording(id: string, path: string) {
  const uid = auth.currentUser?.uid!;
  // 1) delete file from Storage
  await deleteObject(ref(storage, path));
  // 2) delete doc
  await deleteDoc(doc(db, "users", uid, "recordings", id));
  return true;
}
