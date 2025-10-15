import React, { useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  label?: string;
  onPress?: () => void;
  color?: string;       // brand primary
  size?: number;        // diameter
  burstCount?: number;  // particles
  shapes?: string[];    // glyphs to cycle through
};

const COLORS = {
  primary: "#72C55D",
  secondary: "#2A7390",
  accent: "#F29118",
  text: "#1C2630",
};

export default function LeafBurstButton({
  label = "Submit",
  onPress,
  color = COLORS.primary,
  size = 60,
  burstCount = 12,
  shapes = ["\u2663", "♻", "❁", "✿", "✨"], // ♣ as a leaf-like, recycle, flowers, sparkles
}: Props) {
  const anims = useMemo(
    () => Array.from({ length: burstCount }, () => new Animated.Value(0)),
    [burstCount]
  );
  const playing = useRef(false);

  const run = () => {
    if (playing.current) return;
    playing.current = true;

    const animations = anims.map((v) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 700 + Math.random() * 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    Animated.stagger(35, animations).start(() => {
      anims.forEach((v) => v.setValue(0));
      playing.current = false;
    });
  };

  const handlePress = () => {
    run();
    onPress?.();
  };

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View pointerEvents="none" style={styles.particles}>
        {anims.map((v, i) => {
          const angleDeg = -80 + Math.random() * 160; // fan out
          const angle = (angleDeg * Math.PI) / 180;
          const radius = 70 + Math.random() * 50;
          const tx = Math.cos(angle) * radius;
          const ty = Math.sin(angle) * -radius; // mostly upward
          const rot = (Math.random() * 90 - 45) + "deg";
          const glyph = shapes[i % shapes.length];

          const scale = v.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.3, 1.1, 1] });
          const opacity = v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] });

          return (
            <Animated.Text
              key={i}
              style={[
                styles.particle,
                {
                  color: i % 4 === 0 ? COLORS.accent : color,
                  transform: [
                    { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, tx] }) },
                    { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, ty] }) },
                    { rotate: rot },
                    { scale },
                  ],
                  opacity,
                },
              ]}
            >
              {glyph}
            </Animated.Text>
          );
        })}
      </View>

      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: pressed ? "#66B955" : color,
            shadowOpacity: pressed ? 0.12 : 0.22,
          },
        ]}
      >
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: "center", alignItems: "center" },
  particles: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  particle: { position: "absolute", fontSize: 18, textAlign: "center" },
  button: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    paddingHorizontal: 16,
  },
  label: { color: "white", fontWeight: "700" },
});
