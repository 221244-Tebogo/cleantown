import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  collection,
  count,
  doc,
  DocumentData,
  getAggregateFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../context/auth";
import { db } from "../firebase";

type Row = {
  id: string;
  displayName?: string;
  photoURL?: string;
  totalPoints?: number;
  city?: string;
  lastRank?: number;
};

type TabKey = "global" | "local" | "friends";

const COLORS = {
  bg: "#E8F5FF",
  primary: "#0B284A",
  muted: "#6A7A8C",
  card: "#FFFFFF",
  chip: "#D7F0DF",
  gold: "#FFC42E",
  silver: "#D6D6D6",
  bronze: "#C57A2F",
};

const PAGE_SIZE = 30;
const FRIEND_BATCH = 10;

export default function Leaderboard() {
  const { user } = useAuth();
  const uid = (user as any)?.id;

  // profile doc (authoritative source for city + friends)
  const [profile, setProfile] = useState<{ city?: string; friends?: string[]; totalPoints?: number } | null>(null);

  const [tab, setTab] = useState<TabKey>("global");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const lastDocRef = useRef<Record<TabKey, QueryDocumentSnapshot<DocumentData> | null>>({
    global: null,
    local: null,
    friends: null,
  });
  const doneRef = useRef<Record<TabKey, boolean>>({ global: false, local: false, friends: false });

  const [myRank, setMyRank] = useState<number | null>(null);
  const [myPoints, setMyPoints] = useState<number>(0);

  // --- helpers

  const mapSnap = (snap: QueryDocumentSnapshot<DocumentData>[]) =>
    snap.map((d) => ({ id: d.id, ...(d.data() as any) })) as Row[];

  const resetPaging = useCallback((t: TabKey) => {
    lastDocRef.current[t] = null;
    doneRef.current[t] = false;
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      if (!uid) return;
      try {
        // upfront profile read (friends + city)
        const p = await getDoc(doc(db, "users", uid));
        const data = (p.exists() ? (p.data() as any) : {}) || {};
        setProfile({ city: data.city, friends: Array.isArray(data.friends) ? data.friends : [], totalPoints: data.totalPoints ?? 0 });
        setMyPoints(Number(data.totalPoints ?? 0));

        // live watch for my points
        unsub = onSnapshot(doc(db, "users", uid), (snap) => {
          const d = snap.data() as any;
          if (d) {
            setMyPoints(Number(d.totalPoints ?? 0));
          }
        });
      } catch (e) {
        console.warn("Failed to load profile:", e);
      }
    })();
    return () => unsub && unsub();
  }, [uid]);

  const computeMyRank = useCallback(async () => {
    if (!uid) return;
    try {
      const meDoc = await getDoc(doc(db, "users", uid));
      const my = (meDoc.exists() ? (meDoc.data() as any) : {}) || {};
      const myScore = Number(my.totalPoints ?? 0);
      setMyPoints(myScore);

      const agg = await getAggregateFromServer(
        query(collection(db, "users"), where("totalPoints", ">", myScore)),
        { higher: count() }
      );
      const higher = Number(agg.data().higher ?? 0);
      setMyRank(higher + 1);
    } catch (e) {
      console.warn("Failed to compute my rank:", e);
      setMyRank(null);
    }
  }, [uid]);

  useEffect(() => {
    computeMyRank();
  }, [computeMyRank, myPoints]);

  // --- data loaders

  // GLOBAL (realtime first page, then manual pagination)
  const attachGlobal = useCallback(() => {
    setLoading(true);
    resetPaging("global");
    const q1 = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(PAGE_SIZE));
    const unsub = onSnapshot(
      q1,
      (snap) => {
        const docs = snap.docs;
        setRows(mapSnap(docs));
        lastDocRef.current.global = docs.length ? docs[docs.length - 1] : null;
        doneRef.current.global = docs.length < PAGE_SIZE;
        setLoading(false);
      },
      (err) => {
        console.warn("Global listener error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [resetPaging]);

  // LOCAL (realtime)
  const attachLocal = useCallback(
    (city?: string) => {
      setLoading(true);
      resetPaging("local");
      if (!city) {
        setRows([]);
        setLoading(false);
        return () => {};
      }
      // Requires composite index: city ASC + totalPoints DESC
      const q1 = query(
        collection(db, "users"),
        where("city", "==", city),
        orderBy("totalPoints", "desc"),
        limit(PAGE_SIZE)
      );
      const unsub = onSnapshot(
        q1,
        (snap) => {
          const docs = snap.docs;
          setRows(mapSnap(docs));
          lastDocRef.current.local = docs.length ? docs[docs.length - 1] : null;
          doneRef.current.local = docs.length < PAGE_SIZE;
          setLoading(false);
        },
        (err) => {
          console.warn("Local listener error (check composite index):", err);
          setLoading(false);
        }
      );
      return unsub;
    },
    [resetPaging]
  );

  // FRIENDS (batched fetch, sorted client-side; pagination optional by chunks)
  const loadFriends = useCallback(
    async (reset = true) => {
      if (reset) {
        setLoading(true);
        resetPaging("friends");
        setRows([]);
      }
      const friendIds = (profile?.friends ?? []).filter(Boolean);
      // Always include me
      if (uid && !friendIds.includes(uid)) friendIds.push(uid);

      if (friendIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // Batch in chunks of 10 (documentId 'in' limit).
      // We fetch docs, merge, then sort by totalPoints desc.
      try {
        const chunks: string[][] = [];
        for (let i = 0; i < friendIds.length; i += FRIEND_BATCH) {
          chunks.push(friendIds.slice(i, i + FRIEND_BATCH));
        }

        const results: Row[] = [];
        for (const c of chunks) {
          const qs = await getDocs(
            query(collection(db, "users"), where("__name__", "in", c)) // docId IN
          );
          results.push(...mapSnap(qs.docs));
        }

        // sort desc by points and take first N (simulate a page)
        results.sort((a, b) => Number(b.totalPoints ?? 0) - Number(a.totalPoints ?? 0));
        const page = results.slice(0, PAGE_SIZE);
        setRows(page);

        // For simple UX we mark friends as fully loaded if <= PAGE_SIZE
        doneRef.current.friends = results.length <= PAGE_SIZE;
        lastDocRef.current.friends = null; // not used for friends
      } catch (e) {
        console.warn("Friends load error:", e);
      } finally {
        setLoading(false);
      }
    },
    [profile?.friends, resetPaging, uid]
  );

  // switch tabs
  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (tab === "global") {
      unsub = attachGlobal();
    } else if (tab === "local") {
      unsub = attachLocal(profile?.city);
    } else {
      // friends
      loadFriends(true);
    }
    return () => unsub && unsub();
  }, [tab, attachGlobal, attachLocal, loadFriends, profile?.city]);

  // pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (tab === "global") {
        // simply re-attach the listener by toggling state
        const u = attachGlobal();
        setTimeout(() => u && u(), 0); // detach immediately; the existing effect keeps one listener
      } else if (tab === "local") {
        const u = attachLocal(profile?.city);
        setTimeout(() => u && u(), 0);
      } else {
        await loadFriends(true);
      }
      await computeMyRank();
    } finally {
      setRefreshing(false);
    }
  }, [tab, attachGlobal, attachLocal, loadFriends, profile?.city, computeMyRank]);

  // infinite scroll (only for global/local; friends kept simple)
  const onEndReached = useCallback(async () => {
    if (loading) return;
    if (doneRef.current[tab]) return;

    try {
      if (tab === "global") {
        const cursor = lastDocRef.current.global;
        if (!cursor) return;
        const qNext = query(
          collection(db, "users"),
          orderBy("totalPoints", "desc"),
          startAfter(cursor),
          limit(PAGE_SIZE)
        );
        const snap = await getDocs(qNext);
        const docs = snap.docs;
        if (docs.length === 0) {
          doneRef.current.global = true;
          return;
        }
        setRows((prev) => [...prev, ...mapSnap(docs)]);
        lastDocRef.current.global = docs[docs.length - 1];
        doneRef.current.global = docs.length < PAGE_SIZE;
      } else if (tab === "local") {
        const cursor = lastDocRef.current.local;
        if (!cursor) return;
        const qNext = query(
          collection(db, "users"),
          where("city", "==", profile?.city ?? "__none__"),
          orderBy("totalPoints", "desc"),
          startAfter(cursor),
          limit(PAGE_SIZE)
        );
        const snap = await getDocs(qNext);
        const docs = snap.docs;
        if (docs.length === 0) {
          doneRef.current.local = true;
          return;
        }
        setRows((prev) => [...prev, ...mapSnap(docs)]);
        lastDocRef.current.local = docs[docs.length - 1];
        doneRef.current.local = docs.length < PAGE_SIZE;
      }
    } catch (e) {
      console.warn("Paging error:", e);
    }
  }, [loading, tab, profile?.city]);

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={{ alignItems: "center", paddingTop: 8 }}>
        <Image source={require("../assets/images/mascot_celebrate.png")} style={styles.mascot} contentFit="contain" />
        <View style={styles.pointsBadge}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#fff" />
          <Text style={styles.pointsText}>{Number(myPoints ?? 0)}</Text>
        </View>
        <Text style={styles.title}>Leaderboard</Text>

        {/* My Rank chip (works even if I'm off-page) */}
        <View style={styles.myRankChip}>
          <Ionicons name="trophy" size={16} color="#fff" />
          <Text style={styles.myRankText}>
            {myRank ? `Your Rank: #${myRank}` : "Ranking…"}
          </Text>
        </View>
      </View>

      {/* Podium */}
      <View style={styles.podiumRow}>
        <Podium spot={2} value={top3[1]?.totalPoints} name={shortName(top3[1]?.displayName)} color={COLORS.silver} />
        <Podium spot={1} value={top3[0]?.totalPoints} name={shortName(top3[0]?.displayName)} color={COLORS.gold} tall />
        <Podium spot={3} value={top3[2]?.totalPoints} name={shortName(top3[2]?.displayName)} color={COLORS.bronze} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TabButton label="Global" active={tab === "global"} onPress={() => setTab("global")} />
        <TabButton label="Local" active={tab === "local"} onPress={() => setTab("local")} />
        <TabButton label="Friends" active={tab === "friends"} onPress={() => setTab("friends")} />
      </View>

      {/* List */}
      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<View style={styles.listCardTop} />}
        renderItem={({ item, index }) => (
          <RowItem
            rank={index + 4}
            name={item.displayName || "Anonymous"}
            score={item.totalPoints ?? 0}
            trend={trendFrom(item.lastRank, index + 4)}
          />
        )}
        ListEmptyComponent={
          !loading && (
            <View style={{ padding: 16, alignItems: "center" }}>
              <Text style={{ color: COLORS.muted }}>No scores yet.</Text>
            </View>
          )
        }
        ListFooterComponent={<View style={styles.listCardBottom} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        onEndReachedThreshold={0.2}
        onEndReached={onEndReached}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      )}
    </SafeAreaView>
  );
}

/* ---------- small pieces ---------- */

function shortName(n?: string) {
  if (!n) return "—";
  return n.length > 10 ? n.slice(0, 10) + "…" : n;
}

function trendFrom(last?: number, now?: number) {
  if (!last || !now) return 0;
  if (now < last) return 1;
  if (now > last) return -1;
  return 0;
}

function Podium({
  spot,
  value,
  name,
  color,
  tall,
}: {
  spot: 1 | 2 | 3;
  value?: number;
  name?: string;
  color: string;
  tall?: boolean;
}) {
  return (
    <View style={[styles.podiumCol, tall && { marginTop: -12 }]}>
      <View style={[styles.podiumCup, { backgroundColor: color }]}>
        <Ionicons name="person-circle" size={22} color="#fff" />
      </View>
      <View style={[styles.podiumBlock, { backgroundColor: color, height: tall ? 84 : spot === 2 ? 64 : 54 }]}>
        <Text style={styles.podiumScore}>{value ?? 0}</Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {name ?? "—"}
      </Text>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabBtn, active && { backgroundColor: "#6AC46E", borderColor: "#6AC46E" }]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      <Text style={[styles.tabText, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

function RowItem({ rank, name, score, trend }: { rank: number; name: string; score: number; trend: -1 | 0 | 1 }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>
      <Ionicons name="person-circle" size={18} color="#2B2B2B" style={{ marginRight: 8 }} />
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.score}>{score}</Text>
      {trend === 1 && <Ionicons name="caret-up" size={16} color="#2EBE65" style={{ marginLeft: 6 }} />}
      {trend === -1 && <Ionicons name="caret-down" size={16} color="#F44336" style={{ marginLeft: 6 }} />}
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  mascot: { width: 120, height: 90 },
  title: { color: COLORS.primary, fontSize: 28, fontWeight: "800", marginTop: 4 },

  pointsBadge: {
    position: "absolute",
    right: 12,
    top: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  pointsText: { fontWeight: "800", color: "#16924A" },

  myRankChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0EA5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  myRankText: { color: "#fff", fontWeight: "800" },

  podiumRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, marginBottom: 12, paddingHorizontal: 12 },
  podiumCol: { alignItems: "center", width: "33.3%" },
  podiumCup: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  podiumBlock: { width: "84%", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  podiumScore: { color: "#fff", fontWeight: "900" },
  podiumName: { color: COLORS.primary, fontWeight: "700", marginTop: 6 },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#E3F3E6",
    padding: 6,
    borderRadius: 999,
    alignSelf: "center",
    gap: 6,
    marginBottom: 10,
  },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: "#B8E0BF" },
  tabText: { color: COLORS.primary, fontWeight: "700" },

  listCardTop: {
    backgroundColor: COLORS.card,
    height: 10,
    marginHorizontal: 2,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  listCardBottom: {
    backgroundColor: COLORS.card,
    height: 14,
    marginHorizontal: 2,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },

  row: {
    backgroundColor: COLORS.card,
    marginHorizontal: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  rank: { width: 22, textAlign: "right", marginRight: 10, color: COLORS.primary, fontWeight: "800" },
  name: { color: "#2B2B2B", fontWeight: "600", maxWidth: 160 },
  score: { color: COLORS.primary, fontWeight: "800" },

  loading: { position: "absolute", left: 0, right: 0, bottom: 24, alignItems: "center" },
});
