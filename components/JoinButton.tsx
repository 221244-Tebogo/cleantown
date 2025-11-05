// components/JoinButton.tsx
import React from "react";
import { Alert, Pressable, Text } from "react-native";
import { joinCleanup } from "../services/cleanups";

export default function JoinButton({
  cleanupId,
  displayName,
}: {
  cleanupId: string;
  displayName?: string;
}) {
  const onJoin = async () => {
    try {
      const res = await joinCleanup(cleanupId, displayName);
      const msg = res.firstJoin
        ? `Joined! +${res.addedPoints} points earned.`
        : "You're already joined. Name updated.";
      Alert.alert("Cleanup", msg);
    } catch (e: any) {
      Alert.alert("Join failed", e?.message || String(e));
    }
  };

  return (
    <Pressable
      onPress={onJoin}
      style={{ backgroundColor: "#FBBC05", padding: 14, borderRadius: 10 }}
    >
      <Text style={{ color: "#0B0F14", fontWeight: "800" }}>Join Cleanup</Text>
    </Pressable>
  );
}
