// screens/Animation.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text } from "react-native";

type Props = { onDone?: () => void };

export default function SplashAnimation({ onDone }: Props) {
  // simple pulse
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();

    // auto-continue after ~1.6s; adjust if you want longer
    const t = setTimeout(() => onDone?.(), 1600);
    return () => { loop.stop(); clearTimeout(t); };
  }, [onDone, opacity, scale]);

  return (
    <Pressable style={styles.container} onPress={() => onDone?.()}>
      <Animated.View style={[styles.circle, { transform: [{ scale }], opacity }]}>
        <Ionicons name="mic" size={56} color="#ffffff" />
      </Animated.View>
      <Text style={styles.label}>CleanTown</Text>
      <Text style={styles.hint}>Tap to start</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(42,115,144,0.9)", // #2A7390 with alpha
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  label: { color: "white", fontSize: 20, fontWeight: "700", marginTop: 16 },
  hint: { color: "#C8D7E1", fontSize: 14, marginTop: 4 },
});
