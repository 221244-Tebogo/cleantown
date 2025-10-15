// screens/Leaderboard.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useAuth } from "../context/auth";
import { db } from "../firebase";

type Row = {
  id: string;
  displayName?: string;
  photoURL?: string;
  totalPoints?: number;
  city?: string;
  lastRank?: number; // optional: for up/down indicator
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

export default function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("global");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // If you store user.city on profile, we can filter "Local" by that.
  const userCity = (user as any)?.city ?? undefined;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);

      // Basic collection: users with totalPoints
      // Structure expected in Firestore:
      // users/{uid}: { displayName, photoURL, totalPoints, city, friends: [uid, ...] }
      const base = collection(db, "users");

      let q =
        tab === "global"
          ? query(base, orderBy("totalPoints", "desc"), limit(50))
          : tab === "local" && userCity
          ? query(base, where("city", "==", userCity), orderBy("totalPoints", "desc"), limit(50))
          : // friends: client-side filter if you don’t yet have a subcollection
            query(base, orderBy("totalPoints", "desc"), limit(200));

      const snap = await getDocs(q);
      let data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Row[];

      if (tab === "friends") {
        const friendIds: string[] = (user as any)?.friends ?? []; // adjust to your schema
        data = data.filter((r) => r.id === user?.uid || friendIds.includes(r.id));
      }

      if (mounted) {
        setRows(data);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tab, user?.uid]);

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={{ alignItems: "center", paddingTop: 8 }}>
              <Image source={require("../assets/images/mascot_celebrate.png")} style={styles.mascot} contentFit="contain" />
              <View style={styles.pointsBadge}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#fff" />
                <Text style={styles.pointsText}>{Number((user as any)?.totalPoints ?? 0)}</Text>
              </View>
              <Text style={styles.title}>Leaderboard</Text>
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

            {/* List header card */}
            <View style={styles.listCardTop} />
          </>
        }
        data={rest}
        keyExtractor={(item) => item.id}
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
  if (now < last) return 1; // moved up
  if (now > last) return -1; // moved down
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
      style={[
        styles.tabBtn,
        active && { backgroundColor: "#6AC46E", borderColor: "#6AC46E" },
      ]}
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

  podiumRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, marginBottom: 12, paddingHorizontal: 12 },
  podiumCol: { alignItems: "center", width: "33.3%" },
  podiumCup: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  podiumBlock: {
    width: "84%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
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
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#B8E0BF",
  },
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

  loading: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
  },
});
