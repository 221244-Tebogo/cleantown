// components/PointsChip.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useMyPoints } from "../hooks/useMyPoints";

export function PointsChip() {
  const points = useMyPoints(); // single source of truth
  return (
    <View style={styles.pointsBadge}>
      <MaterialCommunityIcons name="shield-check" size={16} color="#fff" />
      <Text style={styles.pointsText}>{Number(points ?? 0)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: { color: "#fff", fontWeight: "800" },
});
