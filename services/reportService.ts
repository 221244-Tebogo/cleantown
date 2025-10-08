// services/reportService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, storage } from "../firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const QUEUE_KEY = "offline_report_queue";

/** Upload a local image (file://...) to Firebase Storage and return a public URL */
async function uploadImageAsync(localUri, uid = "anon") {
  // fetch() works with file:// URIs in Expo and returns a Blob
  const res = await fetch(localUri);
  const blob = await res.blob();

  const key = `reports/${uid}/${Date.now()}.jpg`;
  const storageRef = ref(storage, key);

  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}

/** Create a report (tries online; if upload fails, stores offline for later sync). */
export async function createReport({ userId, coords, category, photoUri }) {
  if (!coords || !photoUri) {
    throw new Error("Photo and coordinates are required.");
  }

  let photoUrl = null;
  try {
    photoUrl = await uploadImageAsync(photoUri, userId || "anon");
  } catch (e) {
    // No network / upload failure → queue for later
    await enqueueOfflineReport({ userId, coords, category, photoUri, when: Date.now() });
    return { queued: true, message: "No network. Saved to offline queue." };
  }

  await addDoc(collection(db, "reports"), {
    userId: userId || null,
    municipalityId: null,
    lat: coords.lat,
    lng: coords.lng,
    category: category || "mixed",
    status: "open",
    submittedAt: serverTimestamp(),
    photoUrl,
  });

  return { queued: false, message: "Report submitted." };
}

/** ---- Offline Queue helpers ---- */
export async function enqueueOfflineReport(item) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const arr = raw ? JSON.parse(raw) : [];
  arr.push(item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
}

export async function getOfflineQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearOfflineQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

/** Try to sync all queued reports (uploads each image then writes Firestore). */
export async function syncOfflineReports() {
  const items = await getOfflineQueue();
  if (!items.length) return { synced: 0 };

  let success = 0;
  for (const it of items) {
    // If any single item fails, we stop and keep the rest (avoid losing data)
    try {
      const url = await uploadImageAsync(it.photoUri, it.userId || "anon");
      await addDoc(collection(db, "reports"), {
        userId: it.userId || null,
        municipalityId: null,
        lat: it.coords.lat,
        lng: it.coords.lng,
        category: it.category || "mixed",
        status: "open",
        submittedAt: serverTimestamp(),
        photoUrl: url,
      });
      success++;
    } catch (e) {
      // bail out—keep remaining items in queue
      break;
    }
  }

  if (success === items.length) {
    await clearOfflineQueue();
  } else if (success > 0) {
    // keep the still-unsynced remainder
    const remainder = items.slice(success);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainder));
  }

  return { synced: success };
}
