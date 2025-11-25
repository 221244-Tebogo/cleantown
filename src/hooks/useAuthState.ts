// hooks/useAuthState.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import { userProfile } from "@/services/userProfile";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user profile exists, create if not
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await userProfile.createUserProfile(user);
          }
        } catch (error) {
          console.error("Error ensuring user profile:", error);
        }
      }

      setUser(user);
      setLoading(false);
    });

    return unsub;
  }, []);

  return { user, loading };
}
