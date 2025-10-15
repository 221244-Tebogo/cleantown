// services/userService.ts
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export type UserProfile = {
  uid: string;
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  createdAt?: any; // serverTimestamp()
  updatedAt?: any; // serverTimestamp()
  // add fields your app actually uses, e.g. ecoPoints, role, etc.
  role?: "user" | "admin";
  ecoPoints?: number;
};

/** CREATE or MERGE a user profile */
export async function upsertUser(uid: string, data: Partial<UserProfile>) {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      uid,
      ...data,
      // don't overwrite createdAt if it already exists
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** PATCH specific fields */
export async function updateUser(uid: string, patch: Partial<UserProfile>) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

/** DELETE a specific SOS event subdoc */
export async function deleteSosEvent(uid: string, sosId: string) {
  await deleteDoc(doc(db, "users", uid, "sosEvents", sosId));
}
