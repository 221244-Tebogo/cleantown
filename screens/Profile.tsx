import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/auth";
import { useMyPoints } from "../hooks/useMyPoints";
import { useMyRank } from "../hooks/useMyRank";

const COLORS = {
  primary: "#0B284A",
  badgeBg: "#DFF6E5",
  badgeText: "#0E8F3B",
  chipBg: "#0EA5E9",
  chipText: "#FFFFFF",
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const points = useMyPoints();     
  const rank = useMyRank();         

  if (!user) return <Text>You’re not signed in.</Text>;

  return (
    <View style={styles.wrap}>
      <Text style={styles.h}>My Profile</Text>
      <Text style={styles.label}>Name</Text>
      <Text style={styles.value}>{user.name ?? "—"}</Text>

      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>{user.email ?? "—"}</Text>

      {/* Live Points badge */}
      <View style={styles.pointsRow}>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{String(points ?? 0)}</Text>
          <Text style={styles.pointsSub}>points</Text>
        </View>

 
        {rank ? (
          <View style={styles.rankChip}>
            <Text style={styles.rankText}>Rank #{rank}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ height: 16 }} />
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20 },
  h: { fontSize: 20, fontWeight: "800", color: COLORS.primary, marginBottom: 12 },
  label: { marginTop: 8, color: "#6A7A8C", fontWeight: "600" },
  value: { fontSize: 16, color: "#2B2B2B", marginTop: 2 },

  pointsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pointsText: { color: COLORS.badgeText, fontWeight: "900", fontSize: 18 },
  pointsSub: { color: COLORS.badgeText, fontWeight: "700" },

  rankChip: {
    backgroundColor: COLORS.chipBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  rankText: { color: COLORS.chipText, fontWeight: "800" },
});
