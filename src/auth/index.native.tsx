// File: src/ui/index.native.tsx
import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export const Screen: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>{children}</ScrollView>
);

export const Card: React.FC<React.PropsWithChildren> = ({ children }) => (
  <View style={{ padding: 16, borderRadius: 12, borderWidth: 1 }}>{children}</View>
);

export const H2: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 8 }}>{children}</Text>
);

export const P: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Text style={{ fontSize: 14 }}>{children}</Text>
);

export const Input = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput {...props} style={[{ borderWidth: 1, borderRadius: 8, padding: 10 }, props.style]} />
);

export const Btn: React.FC<React.ComponentProps<typeof Pressable> & { children: React.ReactNode }> = ({ children, style, ...rest }) => (
  <Pressable {...rest} style={[{ padding: 12, borderRadius: 10, alignItems: "center" }, style]}>
    <Text>{children as any}</Text>
  </Pressable>
);
