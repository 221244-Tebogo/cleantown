import { db } from "../firebase";
import { doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";

// CREATE / UPSERT user profile
export async function upsertUser(uid: string, data: any) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}

// UPDATE a specific field on user profile
export async function updateUser(uid: string, patch: any) {
  await updateDoc(doc(db, "users", uid), patch);
}

// DELETE a specific SOS event
export async function deleteSosEvent(uid: string, sosId: string) {
  await deleteDoc(doc(db, "users", uid, "sosEvents", sosId));
}
