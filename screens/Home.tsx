import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppBackground from "../components/AppBackground";
import { useAuth } from "../context/auth";

const TEXT = "#E6EEF7";
const SUB = "#90A4B8";
const CARD = "rgba(13, 22, 34, 0.7)";
const YELLOW = "#FBBC05";
const ORANGE = "#FF7A2F";
const BLUE = "#8BC3FF";

export default function Home() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const displayName = useMemo(
    () => user?.name || (user?.email ? user.email.split("@")[0] : "Friend"),
    [user?.name, user?.email]
  );

  return (
    <SafeAreaView style={styles.root}>
      <AppBackground />
      {/* Bottom sheet area (single-hand reach) */}
      <View
        style={[
          styles.bottomWrap,
          { paddingBottom: Math.max(16, insets.bottom + 12) }, 
        ]}
      >
        {/* Main Icon */}
        <View style={styles.heroBadge}>
          <Ionicons name="home" size={48} color="#0B0F14" />
        </View>

        {/* Greeting */}
        <Text style={styles.h1}>
          Hello, <Text style={styles.accent}>{displayName}</Text>!
        </Text>
        <Text style={styles.sub}>Your safety matters. I’m listening.</Text>

      
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.primary}
          onPress={() => nav.navigate("VoiceApp")}
          activeOpacity={0.9}
        >
          <Ionicons name="mic" size={24} color="#0B0F14" />
          <Text style={styles.primaryText}>Tap to speak</Text>
        </TouchableOpacity>

        {/* Grid tiles */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.tile} onPress={() => nav.navigate("Leaderboard")} activeOpacity={0.9}>
            <Ionicons name="trophy" size={22} color={YELLOW} />
            <Text style={styles.tileTitle}>Leaderboard</Text>
            <Text style={styles.tileSub}>See top scores</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tile} onPress={() => nav.navigate("MapShare")} activeOpacity={0.9}>
            <Ionicons name="navigate" size={22} color={BLUE} />
            <Text style={styles.tileTitle}>Share Location</Text>
            <Text style={styles.tileSub}>Live map with contacts</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.tile} onPress={() => nav.navigate("Camera")} activeOpacity={0.9}>
            <Ionicons name="camera" size={22} color={BLUE} />
            <Text style={styles.tileTitle}>Camera</Text>
            <Text style={styles.tileSub}>Take a photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tile} onPress={() => nav.navigate("Profile")} activeOpacity={0.9}>
            <Ionicons name="person" size={22} color={YELLOW} />
            <Text style={styles.tileTitle}>Profile</Text>
            <Text style={styles.tileSub}>View & edit</Text>
          </TouchableOpacity>
        </View>

        {/* Single full-width tile */}
        <TouchableOpacity style={styles.tileFull} onPress={() => nav.navigate("Settings")} activeOpacity={0.9}>
          <Ionicons name="settings" size={22} color={YELLOW} />
          <Text style={styles.tileTitle}>Settings</Text>
          <Text style={styles.tileSub}>ICE, language, voice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tileFull} onPress={() => nav.navigate('Chat')} activeOpacity={0.9}>
            <Ionicons name="chatbubbles" size={22} color={BLUE} />
            <Text style={styles.tileTitle}>Gemini Chat</Text>
            <Text style={styles.tileSub}>Talk to our AI assistant</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },

  heroBadge: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 4,
    borderColor: "rgba(251,188,5,0.45)",
  },

  h1: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },
  accent: { color: YELLOW },
  sub: {
    color: "#BFD0E2",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },

  primary: {
    backgroundColor: YELLOW,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryText: {
    color: "#0B0F14",
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },

  grid: { flexDirection: "row", gap: 12 },

  tile: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
  },
  tileFull: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  tileTitle: {
    color: TEXT,
    marginTop: 8,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },
  tileSub: {
    color: SUB,
    marginTop: 4,
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },
});
