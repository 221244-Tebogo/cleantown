// services/reportCreate.ts
import * as FileSystem from "expo-file-system";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { geohashForLocation } from "geofire-common";
import { auth, db, storage } from "../firebase";
import { awardPoints } from "./users";

type Args = {
  coords: { lat: number; lng: number };
  category?: "dumping" | "mixed" | string;
  note?: string;
  photoUri?: string; // optional
  audioUri?: string; // optional (voice note)
  onProgress?: (pct: number) => void;
};

async function uriToBlob(uri: string): Promise<Blob> {
  if (/^(data:|blob:|https?:)/i.test(uri)) {
    const res = await fetch(uri);
    if (!res.ok) throw new Error("Could not read data from URI");
    return await res.blob();
  }
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes =
    typeof atob === "function"
      ? Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
      : Uint8Array.from(Buffer.from(base64, "base64"));
  // Keep contentType flexible: Storage rules already restrict image/audio.
  return new Blob([bytes], { type: "application/octet-stream" });
}

async function uploadWithProgress(
  path: string,
  blob: Blob,
  onProgress?: (p: number) => void
) {
  const objectRef = ref(storage, path);
  const task = uploadBytesResumable(objectRef, blob);
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (onProgress) {
          const pct = Math.round(
            (snap.bytesTransferred / snap.totalBytes) * 100
          );
          onProgress(pct);
        }
      },
      reject,
      () => resolve()
    );
  });
  const url = await getDownloadURL(task.snapshot.ref);
  return { url, storagePath: objectRef.fullPath };
}

export async function createReport({
  coords,
  category = "dumping",
  note = "",
  photoUri,
  audioUri,
  onProgress,
}: Args) {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to submit a report.");

  // Allow ANY of photo OR audio OR note (at least one)
  if (!photoUri && !audioUri && !note.trim()) {
    throw new Error("Add a photo, voice note, or description.");
  }

  const lat = Number(coords.lat),
    lng = Number(coords.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    throw new Error("Invalid coordinates.");

  const stamp = Date.now();
  const day = new Date(stamp).toISOString().slice(0, 10);

  let photoUrl: string | null = null;
  let audioUrl: string | null = null;

  if (photoUri) {
    const blob = await uriToBlob(photoUri);
    const { url } = await uploadWithProgress(
      `reports/${user.uid}/photos/${day}/${stamp}.jpg`,
      blob,
      onProgress
    );
    photoUrl = url;
  }

  if (audioUri) {
    const blob = await uriToBlob(audioUri);
    const { url } = await uploadWithProgress(
      `reports/${user.uid}/audio/${day}/${stamp}.m4a`,
      blob,
      onProgress
    );
    audioUrl = url;
  }

  const geohash = geohashForLocation([lat, lng]);

  // Firestore doc — matches your rules (uid==auth.uid, location, geohash, createdAt)
  const docRef = await addDoc(collection(db, "reports"), {
    uid: user.uid,
    category,
    description: note,
    photoUrl,
    audioUrl,
    location: { lat, lng },
    geohash,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: "open",
    stillThere: 0,
    notThere: 0,
    lastPingAt: null,
  });

  // Points: +10 (your rules allow +1/+2/+10)
  await awardPoints(user.uid, 10);

  return { id: docRef.id, ok: true, addedPoints: 10 };
}
