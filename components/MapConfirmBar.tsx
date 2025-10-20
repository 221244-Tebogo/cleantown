import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title?: string;
  distanceText?: string;
  onStillThere: () => void;
  onNotThere: () => void;
};

export default function MapConfirmBar({
  title = "Report nearby",
  distanceText,
  onStillThere,
  onNotThere,
}: Props) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.container} accessibilityRole="menu">
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {!!distanceText && <Text style={styles.sub}>{distanceText}</Text>}
        </View>
        <Pressable style={[styles.btn, styles.muted]} onPress={onNotThere}>
          <Text style={styles.mutedText}>Not there</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.primary]} onPress={onStillThere}>
          <Text style={styles.primaryText}>Still there</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // wrapper ensures it sits above Map + FABs on all platforms
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    justifyContent: "flex-end",
  },
  container: {
    marginHorizontal: 12,
    marginBottom: 96, // keep above your camera/recenter FABs
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: { fontWeight: "700", color: "#0B284A" },
  sub: { color: "#4B5563", fontSize: 12 },
  btn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  muted: { backgroundColor: "#E9EFF5" },
  primary: { backgroundColor: "#0EA5E9" },
  mutedText: { color: "#0B284A", fontWeight: "700" },
  primaryText: { color: "#fff", fontWeight: "700" },
});
