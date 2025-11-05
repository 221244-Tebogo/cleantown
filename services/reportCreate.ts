// services/reportCreate.ts (or reportService.ts — either is fine)
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { geohashForLocation } from "geofire-common";
import { auth, db, storage } from "../firebase";
import { awardPoints } from "./users";

type CreateReportArgs = {
  coords: { lat: number; lng: number };
  category?: string;
  note?: string;
  photoUri: string;
  onProgress?: (pct: number) => void;
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

  const lat = Number(coords.lat);
  const lng = Number(coords.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    throw new Error("Invalid coordinates.");

  // Upload photo
  const filePath = `reports/${user.uid}/${Date.now()}.jpg`;
  const photoRef = ref(storage, filePath);
  const blob = await (await fetch(photoUri)).blob();

  const uploadTask = uploadBytesResumable(photoRef, blob);
  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (s) =>
        onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
      reject,
      resolve
    );
  });

  const photoUrl = await getDownloadURL(photoRef);
  const geohash = geohashForLocation([lat, lng]);

  // Create report doc (fields match your rules)
  await addDoc(collection(db, "reports"), {
    uid: user.uid,
    location: { lat, lng },
    geohash,
    status: "open",
    photoUrl,
    description: note,
    category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Award points (rules allow +1/+2/+10)
  try {
    await awardPoints(user.uid, 10);
  } catch (e) {
    console.log("awardPoints failed:", e);
  }

  return { photoUrl, filePath };
}
