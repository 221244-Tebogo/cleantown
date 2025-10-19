// /src/services/reportCreate.ts
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { geohashForLocation } from "geofire-common";
import { auth, db, storage } from "../firebase";
import { awardPoints } from "./points";

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

  // 1) Upload image
  const res = await fetch(photoUri);
  const blob = await res.blob();
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
  await awardPoints(uid, 10);
  const downloadURL = await getDownloadURL(task.snapshot.ref);

  // 2) Create Firestore doc (WITH geohash + confirmation fields)
  await addDoc(collection(db, "reports"), {
    uid,
    coords, // { lat, lng }
    geohash: geohashForLocation([coords.lat, coords.lng]),
    category,
    note,
    photoUrl: downloadURL,
    storagePath: objectRef.fullPath,
    createdAt: serverTimestamp(),

    // Waze-like crowd confirmation fields:
    status: "open", // "open" | "maybe_gone" | "closed"
    lastConfirmedAt: serverTimestamp(),
    confirmations: 0,
    dismissals: 0,
    expiresAt: null,
  });

  return { ok: true };
}
