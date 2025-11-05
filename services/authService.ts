import { auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from "firebase/auth";
import { db as firestoreDb } from "../firebase";

/**
 * Registers a user with email/password.
 */
export async function registerUser(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("User Registered:", userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    console.log("Registration Error:", error?.code, error?.message);
    throw error;
  }
}

/**
 * Logs a user in with email/password.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("User Logged In:", userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    console.log("Login Error:", error?.code, error?.message);
    throw error;
  }
}

/**
 * Logs out current user.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
  console.log("User Logged Out.");
}

/**
 * Returns the current user or null.
 */
export function getUserInfo() {
  return auth.currentUser ?? null;
}

//export doc
export async function getUserDoc(uid: string): Promise<any | null> {
  const docRef = doc(firestoreDb, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    console.log("No such document for UID:", uid);
    return null;
  }
}
