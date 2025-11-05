// screens/Settings.tsx
import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/auth";
import AppBackground from "../components/AppBackground";

const YELLOW = "#FBBC05";
const TEXT = "#E6EEF7";
const SUB = "#90A4B8";
const CARD = "#0E1C2C";

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
};

function Row({ icon, label, value, onPress }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={YELLOW} style={{ marginRight: 10 }} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {!!value && <Text style={styles.rowValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color={SUB} />
    </TouchableOpacity>
  );
}

export default function Settings() {
  const navigation = useNavigation<any>();
  const { user, signOut, isLoading } = useAuth();
  const [busy, setBusy] = useState(false);

  const displayName = useMemo(
    () => user?.name || (user?.email ? user.email.split("@")[0] : "User"),
    [user?.name, user?.email]
  );

  const initials = useMemo(() => {
    const src = user?.name || user?.email || "U";
    const parts = String(src).replace(/@.*/, "").split(/\s|\.|_/).filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [user?.name, user?.email]);

  const handleSignOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signOut(); // Auth gate will swap to Login
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <AppBackground />
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.center}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email ?? "-"}</Text>
        </View>

        {/* Settings card */}
        <View style={styles.card}>
          <Row icon="language" label="Language" value="Setswana" onPress={() => {}} />
          <Row icon="megaphone" label="Voice" value="Female" onPress={() => {}} />
          <Row icon="options" label="Preferences" onPress={() => {}} />
        </View>
      </View>

<View style={styles.utilityRow}>
  <TouchableOpacity
    style={styles.homeChip}
    onPress={() => navigation.navigate("Home")}
    activeOpacity={0.9}
  >
    <Ionicons name="home-outline" size={16} color="#0B0F14" style={{ marginRight: 6 }} />
    <Text style={styles.homeChipText}>Home</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.homeChip, (busy || isLoading) && styles.chipDisabled]}
    onPress={handleSignOut}
    disabled={busy || isLoading}
    activeOpacity={0.9}
  >
    <Ionicons name="log-out-outline" size={16} color="#0B0F14" style={{ marginRight: 6 }} />
    <Text style={styles.homeChipText}>{busy ? "Signing out…" : "Sign Out"}</Text>
  </TouchableOpacity>
</View>

    </SafeAreaView>
  );
}

const CHIP_HEIGHT = 44;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  // Add room so chips don’t overlap content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: CHIP_HEIGHT + 28,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: {
    color: "#0B0F14",
    fontSize: 34,
    letterSpacing: 1,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },
  name: {
    color: "#FFFFFF",
    fontSize: 22,
    marginTop: 12,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },
  email: {
    color: TEXT,
    opacity: 0.9,
    fontSize: 13,
    marginTop: 4,
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowLabel: {
    color: TEXT,
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Poppins-Medium",
      android: "Poppins_500Medium",
      default: "Poppins_500Medium",
    }),
  },
  rowValue: {
    color: SUB,
    marginRight: 8,
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },

  utilityRow: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  paddingHorizontal: 16,
  paddingBottom: 16,
  paddingTop: 8,
  backgroundColor: "transparent",
  flexDirection: "row",
  justifyContent: "space-between", // pushes Home left & Sign Out right
  alignItems: "center",
},
homeChip: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 999,
  backgroundColor: YELLOW,
},
homeChipText: {
  color: "#0B0F14",
  fontSize: 12,
  fontFamily: Platform.select({
    ios: "Poppins-Medium",
    android: "Poppins_500Medium",
    default: "Poppins_500Medium",
  }),
},
chipDisabled: {
  opacity: 0.6,
},

});
