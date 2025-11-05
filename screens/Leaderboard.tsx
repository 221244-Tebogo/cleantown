import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  collection, count, doc, DocumentData, getAggregateFromServer, getDoc,
  getDocs, limit, onSnapshot, orderBy, query, QueryDocumentSnapshot,
  startAfter, where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AppBackground from "../components/AppBackground";
import { Colors, Fonts } from "../constants/theme";
import { useAuth } from "../context/auth";
import { db } from "../firebase";

/* ---------------- types ---------------- */

type Row = {
  id: string;
  displayName?: string;
  photoURL?: string;
  totalPoints?: number;
  city?: string;
  lastRank?: number;
};

type TabKey = "global" | "local" | "friends";

/* ---------------- constants (UI only) ---------------- */

const UI = {
  gold:  "#FFC42E",
  silver:"#D6D6D6",
  bronze:"#C57A2F",
  chipBg:"#E6F5E8",              // segmented control track
  chipBd:"#B8E0BF",
  card:  "#FFFFFF",
  rowDiv:"rgba(0,0,0,0.06)",
  name:  "#263645",
};

/* ---------------- data/paging ---------------- */

const PAGE_SIZE = 30;
const FRIEND_BATCH = 10;

export default function Leaderboard() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const uid = (user as any)?.id;

  const [profile, setProfile] = useState<{ city?: string; friends?: string[]; totalPoints?: number } | null>(null);

  const [tab, setTab] = useState<TabKey>("global");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const lastDocRef = useRef<Record<TabKey, QueryDocumentSnapshot<DocumentData> | null>>({
    global: null, local: null, friends: null,
  });
  const doneRef = useRef<Record<TabKey, boolean>>({ global: false, local: false, friends: false });

  const [myRank, setMyRank] = useState<number | null>(null);
  const [myPoints, setMyPoints] = useState<number>(0);

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
        const p = await getDoc(doc(db, "users", uid));
        const data = (p.exists() ? (p.data() as any) : {}) || {};
        setProfile({ city: data.city, friends: Array.isArray(data.friends) ? data.friends : [], totalPoints: data.totalPoints ?? 0 });
        setMyPoints(Number(data.totalPoints ?? 0));
        unsub = onSnapshot(doc(db, "users", uid), (snap) => {
          const d = snap.data() as any;
          if (d) setMyPoints(Number(d.totalPoints ?? 0));
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

  useEffect(() => { computeMyRank(); }, [computeMyRank, myPoints]);

  /* loaders */

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

  const attachLocal = useCallback((city?: string) => {
    setLoading(true);
    resetPaging("local");
    if (!city) {
      setRows([]);
      setLoading(false);
      return () => {};
    }
    const q1 = query(collection(db, "users"), where("city", "==", city), orderBy("totalPoints", "desc"), limit(PAGE_SIZE));
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
        console.warn("Local listener error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [resetPaging]);

  const loadFriends = useCallback(async (reset = true) => {
    if (reset) {
      setLoading(true);
      resetPaging("friends");
      setRows([]);
    }
    const friendIds = (profile?.friends ?? []).filter(Boolean);
    if (uid && !friendIds.includes(uid)) friendIds.push(uid);

    if (friendIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    try {
      const chunks: string[][] = [];
      for (let i = 0; i < friendIds.length; i += FRIEND_BATCH) chunks.push(friendIds.slice(i, i + FRIEND_BATCH));
      const results: Row[] = [];
      for (const c of chunks) {
        const qs = await getDocs(query(collection(db, "users"), where("__name__", "in", c)));
        results.push(...mapSnap(qs.docs));
      }
      results.sort((a, b) => Number(b.totalPoints ?? 0) - Number(a.totalPoints ?? 0));
      const page = results.slice(0, PAGE_SIZE);
      setRows(page);
      doneRef.current.friends = results.length <= PAGE_SIZE;
      lastDocRef.current.friends = null;
    } catch (e) {
      console.warn("Friends load error:", e);
    } finally {
      setLoading(false);
    }
  }, [profile?.friends, resetPaging, uid]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (tab === "global") unsub = attachGlobal();
    else if (tab === "local") unsub = attachLocal(profile?.city);
    else loadFriends(true);
    return () => unsub && unsub();
  }, [tab, attachGlobal, attachLocal, loadFriends, profile?.city]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (tab === "global") { const u = attachGlobal(); setTimeout(() => u && u(), 0); }
      else if (tab === "local") { const u = attachLocal(profile?.city); setTimeout(() => u && u(), 0); }
      else await loadFriends(true);
      await computeMyRank();
    } finally { setRefreshing(false); }
  }, [tab, attachGlobal, attachLocal, loadFriends, profile?.city, computeMyRank]);

  const onEndReached = useCallback(async () => {
    if (loading || doneRef.current[tab]) return;
    try {
      if (tab === "global") {
        const cursor = lastDocRef.current.global; if (!cursor) return;
        const snap = await getDocs(query(collection(db, "users"), orderBy("totalPoints", "desc"), startAfter(cursor), limit(PAGE_SIZE)));
        const docs = snap.docs;
        if (docs.length === 0) { doneRef.current.global = true; return; }
        setRows((prev) => [...prev, ...mapSnap(docs)]);
        lastDocRef.current.global = docs[docs.length - 1];
        doneRef.current.global = docs.length < PAGE_SIZE;
      } else if (tab === "local") {
        const cursor = lastDocRef.current.local; if (!cursor) return;
        const snap = await getDocs(query(
          collection(db, "users"), where("city", "==", profile?.city ?? "__none__"),
          orderBy("totalPoints", "desc"), startAfter(cursor), limit(PAGE_SIZE)
        ));
        const docs = snap.docs;
        if (docs.length === 0) { doneRef.current.local = true; return; }
        setRows((prev) => [...prev, ...mapSnap(docs)]);
        lastDocRef.current.local = docs[docs.length - 1];
        doneRef.current.local = docs.length < PAGE_SIZE;
      }
    } catch (e) { console.warn("Paging error:", e); }
  }, [loading, tab, profile?.city]);

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <AppBackground />

      {/* Header / Mascot / Points */}
      <View style={{ alignItems: "center", paddingTop: Math.max(8, insets.top) }}>
        <Image
          source={require("../assets/images/mascot_celebrate.png")}
          style={styles.mascot}
          contentFit="contain"
        />
        <View style={styles.pointsBadge}>
          <MaterialCommunityIcons name="shield" size={16} color={Colors.brand} />
          <Text style={styles.pointsText}>{Number(myPoints ?? 0)}</Text>
        </View>

        <Text style={styles.title}>Leaderboard</Text>

        {/* My Rank chip */}
        <View style={styles.myRankChip}>
          <Ionicons name="trophy" size={16} color="#fff" />
          <Text style={styles.myRankText}>{myRank ? `#${myRank}` : "Ranking…"}</Text>
        </View>
      </View>

      {/* Podium 2–1–3 */}
      <View style={styles.podiumRow}>
        <Podium spot={2} value={top3[1]?.totalPoints} name={shortName(top3[1]?.displayName)} color={UI.silver} />
        <Podium spot={1} value={top3[0]?.totalPoints} name={shortName(top3[0]?.displayName)} color={UI.gold} tall />
        <Podium spot={3} value={top3[2]?.totalPoints} name={shortName(top3[2]?.displayName)} color={UI.bronze} />
      </View>

      {/* Segmented tabs */}
      <View style={styles.tabs}>
        <TabButton label="Global"  active={tab === "global"}  onPress={() => setTab("global")} />
        <TabButton label="Local"   active={tab === "local"}   onPress={() => setTab("local")} />
        <TabButton label="Friends" active={tab === "friends"} onPress={() => setTab("friends")} />
      </View>

      {/* List inside rounded card */}
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
              <Text style={{ color: Colors.textSub }}>No scores yet.</Text>
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
  spot, value, name, color, tall,
}: { spot: 1 | 2 | 3; value?: number; name?: string; color: string; tall?: boolean; }) {
  return (
    <View style={[styles.podiumCol, tall && { marginTop: -12 }]}>
      <View style={[styles.podiumAvatar, { backgroundColor: color }]}>
        <Ionicons name="person" size={20} color="#fff" />
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
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function RowItem({ rank, name, score, trend }: { rank: number; name: string; score: number; trend: -1 | 0 | 1 }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>
      <Ionicons name="person-circle" size={18} color={UI.name} style={{ marginRight: 8 }} />
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.score}>{score}</Text>
      {trend === 1 && <Ionicons name="caret-up" size={16} color="#2EBE65" style={{ marginLeft: 6 }} />}
      {trend === -1 && <Ionicons name="caret-down" size={16} color="#F44336" style={{ marginLeft: 6 }} />}
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  mascot: { width: 120, height: 90 },

  title: {
    color: Colors.textDark,
    fontSize: 32,
    lineHeight: 36,
    fontFamily: Fonts.h1,           // Cherry Bomb
    marginTop: 2,
    letterSpacing: 0.5,
  },

  pointsBadge: {
    position: "absolute",
    right: 16,
    top: 4,
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
  pointsText: { fontWeight: "800", color: Colors.brand },

  myRankChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  myRankText: { color: "#fff", fontWeight: "800" },

  /* podium */
  podiumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 18,
  },
  podiumCol: { alignItems: "center", width: "33.33%" },
  podiumAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  podiumBlock: {
    width: "84%", borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  podiumScore: { color: "#fff", fontWeight: "900" },
  podiumName: { color: Colors.textDark, fontWeight: "700", marginTop: 6 },

  /* segmented tabs */
  tabs: {
    flexDirection: "row",
    backgroundColor: UI.chipBg,
    borderColor: UI.chipBd,
    borderWidth: 1,
    padding: 6,
    borderRadius: 999,
    alignSelf: "center",
    gap: 6,
    marginBottom: 10,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: UI.chipBd,
    backgroundColor: "transparent",
  },
  tabBtnActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  tabText: { color: Colors.textDark, fontWeight: "700" },
  tabTextActive: { color: "#fff" },

  /* card wrapper (rounded top/bottom) */
  listCardTop: {
    backgroundColor: UI.card,
    height: 10,
    marginHorizontal: 2,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  listCardBottom: {
    backgroundColor: UI.card,
    height: 14,
    marginHorizontal: 2,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  row: {
    backgroundColor: UI.card,
    marginHorizontal: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: UI.rowDiv,
    flexDirection: "row",
    alignItems: "center",
  },
  rank: { width: 22, textAlign: "right", marginRight: 10, color: Colors.textDark, fontWeight: "800" },
  name: { color: UI.name, fontWeight: "600", maxWidth: 160 },
  score: { color: Colors.textDark, fontWeight: "800" },

  loading: { position: "absolute", left: 0, right: 0, bottom: 24, alignItems: "center" },
});
