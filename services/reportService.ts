import * as FileSystem from "expo-file-system";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { geohashForLocation } from "geofire-common";
import { auth, db, storage } from "../firebase";
import { awardPoints } from "./users";

/** Safely convert any Expo/React Native URI into a Blob */
async function uriToBlob(uri: string): Promise<Blob> {
  // fetch works for data:, blob:, http(s):
  if (/^(data:|blob:|https?:)/i.test(uri)) {
    const res = await fetch(uri);
    if (!res.ok) throw new Error("Could not read image data.");
    return await res.blob();
  }
  // file:// or content:// → use FileSystem (handles Android content://)
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const byteChars =
    typeof atob === "function"
      ? atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++)
    byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: "image/jpeg" });
}

type CreateReportArgs = {
  coords: { lat: number; lng: number };
  category?: "mixed" | "plastic" | "cans" | "rubble";
  note?: string;
  photoUri: string;
  onProgress?: (pct: number) => void; // 0..100
};

export async function createReport({
  coords,
  category = "mixed",
  note = "",
  photoUri,
  onProgress,
}: CreateReportArgs) {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to submit a report.");
  if (!photoUri) throw new Error("No photo selected.");

  const lat = Number(coords.lat);
  const lng = Number(coords.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    throw new Error("Invalid coordinates.");

  // ---- Upload photo to Storage (path must match your Storage rules) ----
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}.jpg`;
  const objectRef = ref(storage, `reports/${user.uid}/${day}/${filename}`);

  const blob = await uriToBlob(photoUri);
  const uploadTask = uploadBytesResumable(objectRef, blob, {
    contentType: blob.type || "image/jpeg",
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      (err) => {
        console.log("UPLOAD ERROR:", err?.code, err?.message);
        reject(err);
      },
      () => resolve()
    );
  });

  const photoUrl = await getDownloadURL(uploadTask.snapshot.ref);

  // ---- Build Firestore payload (MUST match your Firestore rules) ----
  // Your rules require: uid == auth.uid, location{lat,lng}, geohash, createdAt (timestamp)
  const geohash = geohashForLocation([lat, lng]);
  const payload = {
    uid: user.uid,
    location: { lat, lng },
    geohash,
    status: "open",
    description: note,
    category,
    photoUrl,
    storagePath: objectRef.fullPath,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    // optional counters if you use them later:
    // stillThere: 0,
    // notThere: 0,
  };

  const docRef = await addDoc(collection(db, "reports"), payload);

  // ---- Award points AFTER the report is successfully created ----
  try {
    await awardPoints(user.uid, 10); // rules allow +1 / +2 / +10
  } catch (e: any) {
    console.log("awardPoints failed:", e?.code, e?.message);
    // Keep the report even if points bump fails.
  }

  return {
    ok: true,
    id: docRef.id,
    message: "Report submitted successfully!",
    photoUrl,
    storagePath: objectRef.fullPath,
  };
}
