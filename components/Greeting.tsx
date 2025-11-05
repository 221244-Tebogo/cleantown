import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

export default function Greeting({ name }: { name: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello, {name}!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },

  text: {
    fontSize: 28,
    color: "#0B0F14", // main text-dark color
    fontFamily: Platform.select({
      ios: "CherryBomb-Regular",
      android: "CherryBomb-Regular",
      default: "CherryBomb-Regular",
    }),
    textAlign: "center",
  },
});
