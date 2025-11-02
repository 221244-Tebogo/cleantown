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

// TODO: It'''s recommended to load these from a .env file
// for better security and to avoid committing them to source control.
const firebaseConfig = {
  apiKey: "AIzaSyAi7MVTxhnAZ0fWUcrNEicuEsBR1dfqCdY",
  authDomain: "cleantown-ad312.firebaseapp.com",
  projectId: "cleantown-ad312",
  storageBucket: "cleantown-ad312.firebasestorage.app",
  messagingSenderId: "907366756783",
  appId: "1:907366756783:web:b0c2212b8f9a08db90ff5a"
};


console.log("✅ Firebase config loaded");

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
