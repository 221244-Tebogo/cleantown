// // services/reportCreate.ts (or reportService.ts — either is fine)
// import { addDoc, collection, serverTimestamp } from "firebase/firestore";
// import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
// import { geohashForLocation } from "geofire-common";
// import { auth, db, storage } from "../firebase";
// import { awardPoints } from "./users";

// type CreateReportArgs = {
//   coords: { lat: number; lng: number };
//   category?: string;
//   note?: string;
//   photoUri: string;
//   onProgress?: (pct: number) => void;
// };

// export async function createReport({
//   coords,
//   category = "mixed",
//   note = "",
//   photoUri,
//   onProgress,
// }: CreateReportArgs) {
//   const user = auth.currentUser;
//   if (!user) throw new Error("You must be signed in to submit a report.");

//   const lat = Number(coords.lat);
//   const lng = Number(coords.lng);
//   if (!Number.isFinite(lat) || !Number.isFinite(lng))
//     throw new Error("Invalid coordinates.");

//   // Upload photo
//   const filePath = `reports/${user.uid}/${Date.now()}.jpg`;
//   const photoRef = ref(storage, filePath);
//   const blob = await (await fetch(photoUri)).blob();

//   const uploadTask = uploadBytesResumable(photoRef, blob);
//   await new Promise<void>((resolve, reject) => {
//     uploadTask.on(
//       "state_changed",
//       (s) =>
//         onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
//       reject,
//       resolve
//     );
//   });

//   const photoUrl = await getDownloadURL(photoRef);
//   const geohash = geohashForLocation([lat, lng]);

//   // Create report doc (fields match your rules)
//   await addDoc(collection(db, "reports"), {
//     uid: user.uid,
//     location: { lat, lng },
//     geohash,
//     status: "open",
//     photoUrl,
//     description: note,
//     category,
//     createdAt: serverTimestamp(),
//     updatedAt: serverTimestamp(),
//   });

//   // Award points (rules allow +1/+2/+10)
//   try {
//     await awardPoints(user.uid, 10);
//   } catch (e) {
//     console.log("awardPoints failed:", e);
//   }

//   return { photoUrl, filePath };
// }

// services/reportCreate.ts
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { geohashForLocation } from "geofire-common";
import { db, storage } from "../firebase";

// IMPORTANT: use the FileSystem legacy shim to avoid the deprecation warning for now

type CreateReportInput = {
  coords: { lat: number; lng: number };
  category: string;
  note: string;
  photoUri: string; // file:// or asset-library://
  onProgress?: (percent: number) => void;
};

async function uriToBlob(uri: string): Promise<Blob> {
  // Works on iOS/Android in Expo runtime
  const res = await fetch(uri);
  const blob = await res.blob();
  return blob;
}

export async function createReport(input: CreateReportInput) {
  const { coords, category, note, photoUri, onProgress } = input;

  // 1) Upload the image to Storage
  const ts = Date.now();
  const storagePath = `reports/${ts}.jpg`;
  const storageRef = ref(storage, storagePath);

  const blob = await uriToBlob(photoUri);
  const metadata = {
    contentType: "image/jpeg",
    cacheControl: "public,max-age=31536000",
  };

  const task = uploadBytesResumable(storageRef, blob, metadata);
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
      (e) => reject(e),
      () => resolve()
    );
  });
  const photoUrl = await getDownloadURL(storageRef);

  // 2) Create Firestore doc (matches your rules)
  const geohash = geohashForLocation([coords.lat, coords.lng]);

  await addDoc(collection(db, "reports"), {
    uid: (await import("firebase/auth")).getAuth().currentUser?.uid ?? null,
    location: { lat: coords.lat, lng: coords.lng },
    geohash,
    category,
    description: note ?? "",
    // You allowed either photoUrl or photoPath in updates; we store URL on create
    photoUrl,
    createdAt: serverTimestamp(),
    status: "open",
    stillThere: 0,
    notThere: 0,
    lastPingAt: serverTimestamp(),
  });
}
