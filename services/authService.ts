// services/authService.ts
import { auth } from "../firebase";
import {
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { Platform } from "react-native";

export const anonymousLogin = async () => {
  const res = await signInAnonymously(auth);
  return res.user;
};

export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

export const registerWithEmail = async (email: string, password: string, displayName?: string) => {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName) await updateProfile(user, { displayName });
  return user;
};

export const sendReset = (email: string) => sendPasswordResetEmail(auth, email.trim());

export const logout = () => signOut(auth);

export const onUserChange = (cb: (u: any) => void) => onAuthStateChanged(auth, cb);

/** --- Google helpers (no expo-auth-session import here) --- */
// Web: sign in with popup
export async function signInWithGoogleWeb() {
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  return user;
}

// Native: take an id_token from Google and sign into Firebase
export async function signInWithGoogleIdToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  const { user } = await signInWithCredential(auth, credential);
  return user;
}

/** --- Phone auth --- */
export function ensureWebRecaptcha(containerId = "recaptcha-container") {
  if (Platform.OS !== "web") return null as any;
  if (!document.getElementById(containerId)) {
    const div = document.createElement("div");
    div.id = containerId;
    div.style.display = "none";
    document.body.appendChild(div);
  }
  if (!(window as any)._recaptchaVerifier) {
    (window as any)._recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  }
  return (window as any)._recaptchaVerifier;
}

export async function phoneStart(phoneE164: string, recaptchaVerifierRefOrNull?: any) {
  if (Platform.OS === "web") {
    const verifier = ensureWebRecaptcha();
    return await signInWithPhoneNumber(auth, phoneE164, verifier);
  } else {
    if (!recaptchaVerifierRefOrNull?.current) throw new Error("Missing reCAPTCHA verifier");
    return await signInWithPhoneNumber(auth, phoneE164, recaptchaVerifierRefOrNull.current);
  }
}

export async function phoneConfirm(confirmation: any, code: string) {
  const cred = await confirmation.confirm(code);
  return cred.user;
}
