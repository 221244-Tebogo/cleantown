import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage, ref } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FB_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FB_MSG_SENDER,
  appId: process.env.EXPO_PUBLIC_FB_APP_ID,
};

console.log("✅ Firebase ENV loaded:", firebaseConfig);

// Initialize Firebase app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ---- Auth (persist on native, default on web) ----
let auth: Auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  auth =
    (globalThis as any)._auth ??
    initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  (globalThis as any)._auth = auth;
}

// ---- Firestore ----
const db =
  Platform.OS === "web"
    ? initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: false,
      })
    : getFirestore(app);

// ---- Realtime DB ----
const rtdb = getDatabase(app);

// ---- Storage ----
const storage = getStorage(app, "gs://cleantown-ad312.firebasestorage.app");
try {
  console.log("🔗 Storage bucket:", ref(storage, "").bucket);
} catch {
  console.log(
    "🔗 Storage bucket (fallback):",
    (storage as any)?._bucket?.name || app.options.storageBucket
  );
}

export { app, auth, db, rtdb, storage };
