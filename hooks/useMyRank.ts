// hooks/useMyRank.ts
import {
  collection,
  count,
  doc,
  getAggregateFromServer,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/auth";
import { db } from "../firebase";

export function useMyRank() {
  const { user } = useAuth();
  const [rank, setRank] = useState<number | null>(null);

  const compute = useCallback(async () => {
    if (!user?.id) return setRank(null);
    const me = await getDoc(doc(db, "users", user.id));
    const myScore = Number((me.data() as any)?.totalPoints ?? 0);

    const agg = await getAggregateFromServer(
      query(collection(db, "users"), where("totalPoints", ">", myScore)),
      { higher: count() }
    );
    const higher = Number(agg.data().higher ?? 0);
    setRank(higher + 1);
  }, [user?.id]);

  useEffect(() => {
    compute();
  }, [compute]);

  return rank;
}
