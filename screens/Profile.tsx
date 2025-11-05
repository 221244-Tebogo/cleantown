import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserInfo, getUserDoc, logoutUser } from "../services/authService";
import AppBackground from "../components/AppBackground";

const YELLOW = "#FBBC05";
const TEXT = "#E6EEF7";
const SUB = "#BFD0E2";
const GOOGLE_RED = "#DB4437";

export default function Profile({ navigation }: any) {
  const user = getUserInfo();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (user?.uid) {
          const d = await getUserDoc(user.uid);
          if (mounted) setProfile(d);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const displayName = useMemo(
    () =>
      profile?.name ||
      user?.displayName ||
      (user?.email ? user.email.split("@")[0] : "User"),
    [profile?.name, user?.displayName, user?.email]
  );

  const initials = useMemo(() => {
    const src = profile?.name || user?.displayName || user?.email || "U";
    const parts = String(src)
      .replace(/@.*/, "")
      .split(/\s|\.|_/)
      .filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts[1]?.[0] || (parts.length > 1 ? parts[parts.length - 1][0] : "");
    return (a + (b || "")).toUpperCase();
  }, [profile?.name, user?.displayName, user?.email]);

  async function onSignOut() {
    try {
      setSigningOut(true);
      await logoutUser();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <AppBackground />
      {/* Center content (like Login’s logo) */}
      <View style={styles.center}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email ?? "-"}</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 12 }} />
        ) : (
          <>
            {profile?.phone && <Text style={styles.meta}>Phone: {profile.phone}</Text>}
          </>
        )}
      </View>

      {/* Bottom bar (thumb zone) */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.btnOutlineDestructive}
          onPress={onSignOut}
          activeOpacity={0.9}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.btnOutlineDestructiveText}>Sign Out</Text>
          )}
        </TouchableOpacity>

        <View style={styles.utilityRow}>
          <View style={{ width: 1 }} />
          <TouchableOpacity
            style={styles.homeChip}
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.9}
          >
            <Ionicons name="home-outline" size={16} color="#0B0F14" style={{ marginRight: 6 }} />
            <Text style={styles.homeChipText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    fontSize: 40,
    letterSpacing: 1,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },

  name: {
    color: "#FFFFFF",
    fontSize: 24,
    marginTop: 16,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },
  email: {
    color: TEXT,
    opacity: 0.9,
    fontSize: 14,
    marginTop: 6,
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },
  meta: {
    color: SUB,
    fontSize: 12,
    marginTop: 6,
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },

  bottom: { 
    paddingHorizontal: 16, 
    paddingBottom: 20, 
    gap: 12 
  },

  btnOutlineDestructive: {
    borderWidth: 1,
    borderColor: GOOGLE_RED,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutlineDestructiveText: {
    color: GOOGLE_RED,
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Poppins-Medium",
      android: "Poppins_500Medium",
      default: "Poppins_500Medium",
    }),
  },

  utilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
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
});
