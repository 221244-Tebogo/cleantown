// firebase.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import {
  getFirestore,
  initializeFirestore, // ⬅️ add this
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// env comes from app.json/app.config via EXPO_PUBLIC_* keys
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FB_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FB_MSG_SENDER,
  appId: process.env.EXPO_PUBLIC_FB_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ---- Auth (persist on native, default on web) ----
let _auth: Auth;
if (Platform.OS === "web") {
  _auth = (globalThis as any)._auth ?? getAuth(app);
} else {
  _auth =
    (globalThis as any)._auth ??
    initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
}
(globalThis as any)._auth = _auth;

// ---- Firestore (use long-polling on web to avoid WebChannel 400s) ----
const db =
  Platform.OS === "web"
    ? initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: false, // stick to XHR; avoids some proxies/adblockers breaking streams
      })
    : getFirestore(app);

// ---- RTDB & Storage (unchanged) ----
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { app, _auth as auth, db, rtdb, storage };
