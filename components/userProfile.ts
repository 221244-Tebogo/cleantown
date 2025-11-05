// services/userProfile.ts
import { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function ensureUserDoc(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName ?? "Anonymous",
      photoURL: user.photoURL ?? "",
      city: "",
      totalPoints: 0,
      createdAt: serverTimestamp(),
    });
  }
}
