import React from "react";
import { Button, Image, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/auth";
import { useMyPoints } from "../hooks/useMyPoints";
import { useMyRank } from "../hooks/useMyRank";

const COLORS = {
  primary: "#0B284A",
  badgeBg: "#DFF6E5",
  badgeText: "#0E8F3B",
  chipBg: "#0EA5E9",
  chipText: "#FFFFFF",
  progressBg: "#E0E0E0",
  progressFg: "#4CAF50",
};

const achievements = [
  { id: 1, name: "First Clean" },
  { id: 2, name: "Eco Warrior" },
  { id: 3, name: "Community Hero" },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const points = useMyPoints();
  const rank = useMyRank();

  if (!user) return <Text>You’re not signed in.</Text>;

  const level = Math.floor((points ?? 0) / 100);
  const xp = (points ?? 0) % 100;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Image
          source={{ uri: `https://i.pravatar.cc/150?u=${user.email}` }}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.h}>{user.name ?? "—"}</Text>
          <Text style={styles.value}>{user.email ?? "—"}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
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

      <View style={styles.levelContainer}>
        <Text style={styles.label}>Level {level}</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${xp}%` }]} />
        </View>
        <Text style={styles.xpText}>{xp} / 100 XP</Text>
      </View>
      
      <Text style={styles.label}>Achievements</Text>
      <View style={styles.achievementsContainer}>
        {achievements.map((achievement) => (
          <View key={achievement.id} style={styles.achievementBadge}>
            <Text style={styles.achievementText}>{achievement.name}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 16 }} />
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  headerText: {
    flex: 1,
  },
  h: { fontSize: 24, fontWeight: "800", color: COLORS.primary },
  label: { marginTop: 16, color: "#6A7A8C", fontWeight: "600", fontSize: 16 },
  value: { fontSize: 16, color: "#2B2B2B", marginTop: 2 },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
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
  levelContainer: {
    marginTop: 16,
  },
  progressContainer: {
    height: 20,
    backgroundColor: COLORS.progressBg,
    borderRadius: 10,
    marginTop: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.progressFg,
  },
  xpText: {
    marginTop: 4,
    color: "#6A7A8C",
    textAlign: "right",
  },
  achievementsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  achievementBadge: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  achievementText: {
    color: "#333",
    fontWeight: "600",
  },
});
