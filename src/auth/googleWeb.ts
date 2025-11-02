// File: src/auth/googleWeb.ts  (make it lazy-safe for native)
import { Platform } from "react-native";
import { auth } from "../../firebase";

export async function signInWithGoogleWeb() {
  if (Platform.OS !== "web") throw new Error("Not running on web");
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth"); // lazy, web-only
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}
