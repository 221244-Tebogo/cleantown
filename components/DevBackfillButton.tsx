import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { backfillAllReportsOnce } from "../scripts/backfillAll";

export default function DevBackfillButton() {
  const [running, setRunning] = useState(false);
  return (
    <View style={{ position: "absolute", left: 12, right: 12, bottom: 140 }}>
      <Pressable
        disabled={running}
        onPress={async () => {
          setRunning(true);
          try {
            await backfillAllReportsOnce();
          } finally {
            setRunning(false);
          }
        }}
        style={{
          backgroundColor: running ? "#94a3b8" : "#0EA5E9",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {running ? "Backfilling…" : "Run backfill (dev)"}
        </Text>
      </Pressable>
    </View>
  );
}
