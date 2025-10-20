// components/MapRecenter.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

export default function MapRecenter({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ position: "absolute", right: 16, bottom: 20 }}>
      <Pressable
        onPress={onPress}
        style={{ backgroundColor: "#fff", borderRadius: 24, padding: 12, elevation: 3 }}
      >
        <Ionicons name="locate" size={20} color="#0B284A" />
      </Pressable>
    </View>
  );
}
