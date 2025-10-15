import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

export default function BadgePop({ title = "Badge Unlocked!", color = "#F29118" }) {
  const s = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(s, { toValue: 1, useNativeDriver: true, friction: 6, tension: 120 }).start();
  }, []);
  return (
    <Animated.View style={[styles.card, { transform: [{ scale: s }] }]}>
      <Text style={[styles.emoji, { color }]}>🏅</Text>
      <Text style={styles.title}>{title}</Text>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  card: {
    position: "absolute", top: "35%", alignSelf: "center",
    backgroundColor: "white", borderRadius: 16, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 14, elevation: 8,
    alignItems: "center",
  },
  emoji: { fontSize: 40, marginBottom: 6 },
  title: { fontSize: 16, fontWeight: "800", color: "#1C2630" },
});
