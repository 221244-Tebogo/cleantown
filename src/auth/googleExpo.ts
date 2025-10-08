// src/auth/googleExpo.js
import { signInAnonymously, signOut } from "firebase/auth";
import { auth } from "../../firebase"; // ensure firebase.ts exports `auth`

/** Sign in anonymously (creates a temporary Firebase user). */
export async function anonSignIn() {
  const cred = await signInAnonymously(auth);
  return cred.user; // { uid, isAnonymous: true, ... }
}

/** Sign out current user. */
export async function doSignOut() {
  await signOut(auth);
}
