import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/auth";
import { db } from "../firebase";

type Identity = { name: string; loading: boolean };

export function useMyIdentity(): Identity {
  const { user, authReady } = useAuth();

  // derive an immediate, non-empty name from Auth (synchronous)
  const authName = useMemo(() => {
    if (!user) return "";
    return user.displayName?.trim() || user.email?.split("@")[0] || user.uid;
  }, [user]);

  // start with authName so UI has something real instantly
  const [name, setName] = useState<string>(authName);
  const [loading, setLoading] = useState(true);

  // keep state in sync if authName changes (e.g., user logs in/out)
  useEffect(() => {
    setName(authName);
  }, [authName]);

  useEffect(() => {
    if (!authReady) return;
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.data() as any | undefined;
        const docName = d?.displayName?.trim?.();
        // override with Firestore displayName if present; otherwise keep authName
        setName(docName || authName);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [authReady, user?.uid, authName]);

  // never return an empty string; worst case we show authName or UID
  return { name: name || authName, loading };
}
