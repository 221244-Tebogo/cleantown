import {
  doc,
  updateDoc,
  increment,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";

export const pointsActions = {
  async reportLitter(userId: string, hasPhoto: boolean = false) {
    try {
      console.log("Adding points for user:", userId);

      const userRef = doc(db, "users", userId);
      const pointsToAdd = hasPhoto ? 150 : 100;

      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log("Creating new user document");
        await setDoc(userRef, {
          uid: userId,
          points: pointsToAdd,
          totalPoints: pointsToAdd,
          displayName: `EcoHero ${userId.slice(0, 4)}`,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });
      } else {
        console.log("Updating existing user points");

        await updateDoc(userRef, {
          points: increment(pointsToAdd),
          totalPoints: increment(pointsToAdd),
          lastUpdated: serverTimestamp(),
        });
      }

      console.log("Points added successfully");
      return true;
    } catch (error) {
      console.error("Error adding points:", error);
      return false;
    }
  },

  async confirmStatus(userId: string, status: string) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const pointsToAdd = 30;

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: userId,
          points: pointsToAdd,
          totalPoints: pointsToAdd,
          displayName: `EcoHero ${userId.slice(0, 4)}`,
          lastUpdated: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          points: increment(pointsToAdd),
          totalPoints: increment(pointsToAdd),
          lastUpdated: serverTimestamp(),
        });
      }

      console.log(
        `Added ${pointsToAdd} points for confirming status (${status})`
      );
      return true;
    } catch (error) {
      console.error("Error adding confirmation points:", error);
      return false;
    }
  },

  async fixUserPoints(userId: string) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const updates: any = {};

        if (data.points === undefined && data.totalPoints !== undefined) {
          updates.points = data.totalPoints;
        }
        if (data.totalPoints === undefined && data.points !== undefined) {
          updates.totalPoints = data.points;
        }
        if (data.points === undefined && data.totalPoints === undefined) {
          updates.points = 0;
          updates.totalPoints = 0;
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(userRef, updates);
          console.log("Fixed user points:", updates);
        }
      }

      return true;
    } catch (error) {
      console.error("Error fixing user points:", error);
      return false;
    }
  },

  async createEvent(userId: string) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const pointsToAdd = 80;

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: userId,
          points: pointsToAdd,
          totalPoints: pointsToAdd,
          displayName: `EcoHero ${userId.slice(0, 4)}`,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          points: increment(pointsToAdd),
          totalPoints: increment(pointsToAdd),
          lastUpdated: serverTimestamp(),
        });
      }

      console.log(`Added ${pointsToAdd} points for creating an event`);
      return true;
    } catch (error) {
      console.error("Error adding event creation points:", error);
      return false;
    }
  },

  async joinEvent(userId: string) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const pointsToAdd = 40;

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: userId,
          points: pointsToAdd,
          totalPoints: pointsToAdd,
          displayName: `EcoHero ${userId.slice(0, 4)}`,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          points: increment(pointsToAdd),
          totalPoints: increment(pointsToAdd),
          lastUpdated: serverTimestamp(),
        });
      }

      console.log(`Added ${pointsToAdd} points for joining an event`);
      return true;
    } catch (error) {
      console.error("Error adding event join points:", error);
      return false;
    }
  },
};
