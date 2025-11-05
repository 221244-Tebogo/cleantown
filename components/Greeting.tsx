import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Greeting({ name }: { name: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello, {name}!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  text: { fontSize: 24, fontWeight: "bold", color: "#E6EEF7" },
});
