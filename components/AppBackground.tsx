// components/ui/AppBackground.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * Radial: center ~25% color -> #D3F3F0, edges -> #BBE2F1
 */
export default function AppBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="bg" cx="50%" cy="45%" r="75%">
            <Stop offset="25%" stopColor="#D3F3F0" />
            <Stop offset="100%" stopColor="#BBE2F1" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#bg)" />
      </Svg>
    </View>
  );
}
