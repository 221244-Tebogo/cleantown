import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";

export default function EcoPointsTicker({ add = 50, color = "#72C55D" }) {
  const [value, setValue] = useState(0);
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    a.setValue(0);
    Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: true }).start(() =>
      setValue(add)
    );
  }, [add]);

  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const scale = a.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.9, 1.05, 1] });

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY }, { scale }] }]}>
      <Text style={[styles.plus, { color }]}>+{value || add} XP</Text>
      <Text style={[styles.spark, { color }]}>✨</Text>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  plus: { fontSize: 18, fontWeight: "800" },
  spark: { fontSize: 16, opacity: 0.9 },
});
