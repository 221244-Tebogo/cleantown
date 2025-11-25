import { doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "@/firebase/config";

export const userProfile = {
  async createUserProfile(user: any) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0] || "EcoHero",
        photoURL: user.photoURL || null,
        points: 0,
        totalPoints: 0,
        achievements: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
        city: "",
        friends: [],
      };

      await setDoc(userRef, userData);
      console.log("User profile created successfully");
      return userData;
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  },

  async updateUserPoints(uid: string, pointsToAdd: number) {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        points: increment(pointsToAdd),
        totalPoints: increment(pointsToAdd),
        lastUpdated: new Date(),
      });
      console.log(`Added ${pointsToAdd} points to user ${uid}`);
    } catch (error) {
      console.error("Error updating user points:", error);
      throw error;
    }
  },
};
