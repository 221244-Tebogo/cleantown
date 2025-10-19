import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, db, storage } from "../firebase";

type CreateReportArgs = {
  coords: { lat: number; lng: number };
  category: string;
  note: string;
  photoUri: string;
  onProgress?: (pct: number) => void; // 0..100
};

export async function createReport({
  coords,
  category,
  note,
  photoUri,
  onProgress,
}: CreateReportArgs) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  if (!photoUri) throw new Error("No photo selected.");

  // URI -> Blob (Expo/Web safe)
  const res = await fetch(photoUri);
  const blob = await res.blob();

  // Path must match Storage rules: reports/<uid>/<date>/<filename>
  const day = new Date().toISOString().slice(0, 10); // e.g., 2025-10-18
  const key = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const objectRef = ref(storage, `reports/${uid}/${day}/${key}`);

  const task = uploadBytesResumable(objectRef, blob, {
    contentType: "image/jpeg",
  });

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        onProgress?.(Math.round(pct));
      },
      reject,
      () => resolve()
    );
  });

  await submitReport({
    uid,
    coords,
    category,
    note,
    task,
    objectRef,
  });

  return { message: "Report submitted successfully!" };
}

type SubmitReportArgs = {
  uid: string;
  coords: { lat: number; lng: number };
  category: string;
  note: string;
  task: ReturnType<typeof uploadBytesResumable>;
  objectRef: ReturnType<typeof ref>;
};

export async function submitReport({
  uid,
  coords,
  category,
  note,
  task,
  objectRef,
}: SubmitReportArgs) {
  const downloadURL = await getDownloadURL(task.snapshot.ref);

  await addDoc(collection(db, "reports"), {
    uid,
    coords,
    category,
    note,
    photoUrl: downloadURL,
    storagePath: objectRef.fullPath,
    createdAt: serverTimestamp(),
  });
}
