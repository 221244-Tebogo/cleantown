import React from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ViewStyle } from "react-native";

type Children = { children?: React.ReactNode };
type BtnProps = Children & { onPress?: () => void; style?: ViewStyle | ViewStyle[] };
type CardProps = Children & { style?: ViewStyle | ViewStyle[] };
type InputProps = React.ComponentProps<typeof TextInput>;

export const Screen: React.FC<Children> = ({ children }) => (
  <View style={styles.screen}>{children}</View>
);

export const Card: React.FC<CardProps> = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const H2: React.FC<Children> = ({ children }) => (
  <Text style={styles.h2}>{children}</Text>
);

export const P: React.FC<Children> = ({ children }) => (
  <Text style={styles.p}>{children}</Text>
);

export const Input: React.FC<InputProps> = (props) => (
  <TextInput {...props} style={[styles.input, props.style as any]} />
);

export const Btn: React.FC<BtnProps> = ({ children, onPress, style }) => (
  <TouchableOpacity style={[styles.btn, style]} onPress={onPress}>
    <Text style={styles.btnText}>{children}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fa", padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  h2: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  p: { fontSize: 14, color: "#3a3a3a" },
  input: {
    borderWidth: 1,
    borderColor: "#e1e5ea",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  btn: {
    backgroundColor: "#1167e2",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
