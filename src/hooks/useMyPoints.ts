// src/hooks/useMyPoints.ts
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "../context/auth";
import { db } from "../../firebase";

export function useMyPoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState<number>(0);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(doc(db, "users", user.id), (snap) => {
      const d = snap.data() as any;
      setPoints(Number(d?.totalPoints ?? 0));
    });
    return () => unsub();
  }, [user?.id]);

  return points;
}
