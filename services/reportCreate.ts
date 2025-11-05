// services/reportCreate.ts
import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  UploadTask,
} from "firebase/storage";
import { geohashForLocation } from "geofire-common";
import { db, storage } from "../firebase";

// Use legacy shim to silence current SDK deprecation logs

type CreateReportInput = {
  coords: { lat: number; lng: number };
  category: string;
  note: string;
  photoUri: string; // file:// URI from Camera or ImagePicker
  onProgress?: (percent: number) => void;
};

function guessContentType(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg"; // safe default
}

async function uriToBlob(uri: string): Promise<Blob> {
  // Expo runtime supports fetch(file://) → blob
  const res = await fetch(uri);
  if (!res.ok)
    throw new Error(`Failed to read file: ${res.status} ${res.statusText}`);
  return await res.blob();
}

export async function createReport(input: CreateReportInput) {
  const { coords, category, note, photoUri, onProgress } = input;

  // 0) Require auth (your Storage rules need request.auth.uid to match the path)
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid)
    throw new Error("Not signed in. Please log in before submitting a report.");

  // 1) Prepare upload target that matches your Storage rules: reports/<uid>/**
  const ts = Date.now();
  const ext =
    photoUri.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase() ||
    "jpg";
  const contentType = guessContentType(photoUri);
  const filename = `${ts}.${ext}`;
  const storagePath = `reports/${uid}/${filename}`; // ✅ matches rules
  const storageRef = ref(storage, storagePath);

  // 2) Read file and upload with metadata (contentType required by your rules)
  const blob = await uriToBlob(photoUri);
  const metadata = {
    contentType,
    cacheControl: "public,max-age=31536000",
  };

  const task: UploadTask = uploadBytesResumable(storageRef, blob, metadata);

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (onProgress && snap.totalBytes > 0) {
          const pct = Math.round(
            (snap.bytesTransferred / snap.totalBytes) * 100
          );
          onProgress(pct);
        }
      },
      (err) => {
        // Surface the real Firebase Storage error code to the UI/logs
        console.log("Storage upload error:", {
          code: (err as any)?.code,
          message: (err as any)?.message,
          name: (err as any)?.name,
        });
        reject(err);
      },
      () => resolve()
    );
  });

  const photoUrl = await getDownloadURL(storageRef);

  // 3) Create the Firestore document (your Firestore create rules are fine)
  const geohash = geohashForLocation([coords.lat, coords.lng]);

  await addDoc(collection(db, "reports"), {
    uid,
    location: { lat: coords.lat, lng: coords.lng },
    geohash,
    category,
    description: note ?? "",
    photoUrl,
    createdAt: serverTimestamp(),
    status: "open",
    stillThere: 0,
    notThere: 0,
    lastPingAt: serverTimestamp(),
  });
}
