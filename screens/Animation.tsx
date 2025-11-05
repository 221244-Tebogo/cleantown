// screens/Animation.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, Platform } from "react-native";
import { Image } from "expo-image";

type Props = { onDone?: () => void };

// assets
const CITIZEN = require("../assets/images/citizen_report.png");

// brand
const BG = "#0B284A";      // app background
const ACCENT = "#72C55D";  // brand green
const TEXT_DARK = "#0B0F14";
const TEXT_LIGHT = "#E6EEF7";

export default function SplashAnimation({ onDone }: Props) {
  // pulse scale + soft glow ring
  const scale = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0)).current; // 0..1 for opacity/size

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.12, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ring, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(ring, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]),
      ])
    );
    loop.start();

    const t = setTimeout(() => onDone?.(), 1400); // quick handoff
    return () => { loop.stop(); clearTimeout(t); };
  }, [onDone, ring, scale]);

  const ringSize = ring.interpolate({ inputRange: [0, 1], outputRange: [0, 26] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.0, 0.35] });

  return (
    <Pressable onPress={() => onDone?.()} style={styles.container}>
      {/* glow ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: Animated.add(1, Animated.divide(ringSize, 100)) }],
            borderColor: ACCENT,
          },
        ]}
      />

      {/* icon pill */}
      <Animated.View style={[styles.pill, { transform: [{ scale }] }]}>
        <Image source={CITIZEN} style={{ width: 84, height: 84 }} contentFit="contain" />
      </Animated.View>

      <Text style={styles.title}>CleanTown</Text>
      <Text style={styles.hint}>Tap to start</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,               // ✅ kills white flash
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
  },
  pill: {
    width: 140,
    height: 140,
    borderRadius: 28,
    backgroundColor: "#FFF7CA",        // Main bottom card color from your spec
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    marginTop: 16,
    fontSize: 32,
    color: TEXT_LIGHT,
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "CherryBombOne_400Regular",
      android: "CherryBombOne_400Regular",
      default: "CherryBombOne_400Regular",
    }),
  },
  hint: {
    marginTop: 6,
    fontSize: 13,
    color: "#BFD0E2",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },
});
