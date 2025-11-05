import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import AppBackground from "../components/AppBackground";
import { useAuth } from "../context/auth";

// ASSETS (adjust if your filenames differ)
const MASCOT = require("../assets/images/mascot_celebrate.png");
const BADGE_SHIELD = require("../assets/images/Gold.png"); // fallback to an icon if this doesn't exist

const TEXT = "#0B284A";
const SUBTXT = "#246E8E";
const CARD_BG = "rgba(255,255,255,0.9)";
const SOFT_BG = "rgba(255,255,255,0.6)";
const YELLOW = "#FBBC05";
const ORANGE = "#FF7A2F";
const BLUE = "#8BC3FF";

export default function Home() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const displayName = useMemo(
    () => user?.name || (user?.email ? user.email.split("@")[0] : "Eco Hero"),
    [user?.name, user?.email]
  );

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <AppBackground />

      {/* TOP HERO */}
      <View style={[styles.heroWrap, { paddingTop: Math.max(8, insets.top) }]}>
        <View style={styles.heroRow}>
          <Image source={MASCOT} style={styles.mascot} resizeMode="contain" />

          <View style={styles.rightHero}>
            {/* Points pill */}
            <View style={styles.pointsPill}>
              {/* If your badge image path is uncertain, show an icon instead */}
              <Image
                source={BADGE_SHIELD}
                style={styles.badge}
                resizeMode="contain"
                onError={() => {}}
              />
              <Text style={styles.pointsText}>00</Text>
            </View>

            <Text style={styles.welcomeTop}>WELCOME,</Text>
            <Text style={styles.welcomeName}>{displayName}</Text>
          </View>
        </View>
      </View>

      {/* SECTION TITLE */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Select Category</Text>
      </View>

      {/* CATEGORY CARDS */}
      <View style={styles.cardsRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => nav.navigate("Camera")} // Identify Trash
          style={[styles.card, { backgroundColor: "#F5FFD9" }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: SOFT_BG }]}>
            <Ionicons name="camera" size={28} color="#4CAF50" />
          </View>
          <Text style={styles.cardTitle}>Identify Trash</Text>
        </TouchableOpacity>

  <TouchableOpacity
  activeOpacity={0.9}
  onPress={() => nav.navigate("Cleanups")} 
  style={[styles.card, { backgroundColor: "#FFE7D9" }]}
>
  <View style={[styles.iconWrap, { backgroundColor: SOFT_BG }]}>
    <Ionicons name="location" size={28} color="#FF7A2F" />
  </View>
  <Text style={styles.cardTitle}>Hotspots</Text>
</TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => nav.navigate("Leaderboard")} // Leaderboard
          style={[styles.card, { backgroundColor: "#FFE8A3" }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: SOFT_BG }]}>
            <MaterialCommunityIcons name="trophy" size={28} color="#E09F1F" />
          </View>
          <Text style={styles.cardTitle}>Leaderboard</Text>
        </TouchableOpacity>
      </View>

      {/* CITIZEN PANEL */}
      <View style={styles.citizenPanel}>
        <Image source={MASCOT} style={styles.citizenMascot} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={styles.citizenTitle}>
            <Text style={{ textTransform: "lowercase" }}>the </Text>
            <Text style={{ textTransform: "capitalize" }}>Citizen</Text>
          </Text>
          <Text style={styles.citizenSub}>
            Report litter, join cleanups, earn rewards
          </Text>
        </View>
        <MaterialCommunityIcons name="shield-check" size={24} color="#B87333" />
      </View>

      {/* BOTTOM TABS ARE IN App.tsx; this screen just respects their space */}
      <View style={{ height: Math.max(12, insets.bottom + 6) }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  heroWrap: { paddingHorizontal: 20 },
  heroRow: { flexDirection: "row", alignItems: "center" },

  mascot: {
    width: 140,
    height: 140,
    marginRight: 8,
  },

  rightHero: { flex: 1, alignItems: "flex-end" },

  pointsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  badge: { width: 22, height: 22, marginRight: 8 },
  pointsText: {
    color: "#0B0F14",
    fontSize: 16,
    fontWeight: "700",
  },

  welcomeTop: {
    color: "#1D4E89",
    fontSize: 28,
    lineHeight: 32,
    marginTop: 12,
    fontFamily: Platform.select({
      ios: "Poppins-Bold",
      android: "Poppins_700Bold",
      default: "Poppins_700Bold",
    }),
    letterSpacing: 1,
  },
  welcomeName: {
    color: "#4A87A7",
    fontSize: 18,
    marginTop: 4,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },

  sectionHead: { paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: {
    color: "#0D2232",
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Poppins-Black",
      android: "Poppins_800ExtraBold",
      default: "Poppins_800ExtraBold",
    }),
  },

  cardsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  iconWrap: {
    alignSelf: "flex-start",
    borderRadius: 12,
    padding: 10,
  },
  cardTitle: {
    color: "#0B0F14",
    fontSize: 14,
    marginTop: 8,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },

  citizenPanel: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: "rgba(255,245,224,0.95)",
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  citizenMascot: { width: 64, height: 64 },
  citizenTitle: {
    color: "#0B0F14",
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Poppins-Bold",
      android: "Poppins_700Bold",
      default: "Poppins_700Bold",
    }),
  },
  citizenSub: {
    color: "#263645",
    fontSize: 12,
    marginTop: 4,
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },
});
