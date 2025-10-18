import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import React from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../context/auth";

const COLORS = {
  bg: "#E8F5FF",
  primary: "#0B284A",
  text: "#2B2B2B",
  muted: "#6A7A8C",
  card: "#FFFFFF",
  badge: "#DFF6E5",
  badgeText: "#0E8F3B",
  tile1: "#ECFBD8",
  tile2: "#FFD9CF",
  tile3: "#FFE5A8",
  chipBg: "#FFF7DB",
};

export default function Home() {
  const nav = useNavigation<any>();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces showsVerticalScrollIndicator={false}>
        {/* Header / Points */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTop}>WELCOME,</Text>
            <Text style={styles.welcomeSub}>Eco Hero</Text>
          </View>

          <View style={styles.pointsBadge}>
            <View style={styles.shield}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#fff" />
            </View>
            <Text style={styles.pointsText}>00</Text>
          </View>

          {/* small action link */}
          <Pressable
            onPress={user ? signOut : () => nav.navigate("Profile")}
            hitSlop={10}
            style={{ marginLeft: 8 }}
          >
            <Text style={styles.linkText}>{user ? "Logout" : "Profile"}</Text>
          </Pressable>
        </View>

        {/* Mascot */}
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.hero}
          contentFit="contain"
          transition={400}
        />

        {/* Section title */}
        <Text style={styles.sectionTitle}>Select Category</Text>

        {/* Category tiles */}
        <View style={styles.tilesRow}>
          <Tile
            color={COLORS.tile1}
            label="Identify Trash"
            icon={<Ionicons name="camera" size={22} />}
            onPress={() => nav.navigate("Report")}
          />
          <Tile
            color={COLORS.tile2}
            label="Hotspots"
            icon={<Ionicons name="location" size={22} />}
            onPress={() => nav.navigate("Map")}
          />
          <Tile
            color={COLORS.tile3}
            label="Leaderboard"
            icon={<FontAwesome5 name="medal" size={20} />}
            onPress={() => nav.navigate("Leaderboard")}
          />
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Image
            source={require("../assets/images/citizen_report.png")}
            style={styles.miniHero}
            contentFit="contain"
          />
          <View style={{ flex: 1 }}>
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <MaterialCommunityIcons name="leaf" size={14} color="#7A4B00" />
              </View>
            </View>
            <Text style={styles.infoTitle}>
              the <Text style={{ fontWeight: "700" }}>Citizen</Text>
            </Text>
            <Text style={styles.infoBody}>Report litter, join cleanups, earn rewards</Text>
          </View>
        </View>

        {/* Bottom nav (static for home) */}
        <View style={styles.bottomNav}>
          <NavIcon active icon={<Ionicons name="home" size={22} color={COLORS.primary} />} onPress={() => {}} />
          <NavIcon icon={<FontAwesome5 name="recycle" size={20} color={COLORS.primary} />} onPress={() => nav.navigate("Cleanups")} />
          <NavIcon icon={<Ionicons name="trophy" size={22} color={COLORS.primary} />} onPress={() => nav.navigate("Leaderboard")} />
          <NavIcon icon={<Ionicons name="person-circle" size={24} color={COLORS.primary} />} onPress={() => nav.navigate("Profile")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------- small components ----------------- */

function Tile({
  color,
  label,
  icon,
  onPress,
}: {
  color: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.tile, { backgroundColor: color }]}
      onPress={onPress}
    >
      <View style={styles.tileIcon}>{icon}</View>
      <Text style={styles.tileText} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function NavIcon({
  icon,
  onPress,
  active,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.navIcon,
        active && {
          backgroundColor: "#D6F1E1",
          shadowColor: "#000",
          shadowRadius: 6,
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        },
      ]}
    >
      {icon}
    </Pressable>
  );
}

/* ----------------- styles ----------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 16, paddingBottom: 28, gap: 14 },

  headerRow: { flexDirection: "row", alignItems: "center" },
  welcomeTop: { color: COLORS.primary, fontSize: 28, fontWeight: "800", letterSpacing: 0.4 },
  welcomeSub: { color: COLORS.muted, fontSize: 18, fontWeight: "600", marginTop: -2 },

  linkText: { color: COLORS.primary, fontWeight: "700" },

  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.badge,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    marginLeft: 8,
  },
  shield: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  pointsText: { color: COLORS.badgeText, fontWeight: "700" },

  hero: { width: "100%", height: 170 },

  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800", marginTop: 2 },

  tilesRow: { flexDirection: "row", gap: 12 },
  tile: { flex: 1, borderRadius: 16, padding: 12 },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tileText: { color: "#1A1A1A", fontSize: 13.5, fontWeight: "700" },

  infoCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  miniHero: { width: 72, height: 72, borderRadius: 12 },

  chipRow: { flexDirection: "row", marginBottom: 6 },
  chip: { backgroundColor: COLORS.chipBg, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, alignSelf: "flex-start" },
  infoTitle: { color: COLORS.primary, fontSize: 18, fontWeight: "600", marginBottom: 2 },
  infoBody: { color: COLORS.muted, fontSize: 13.5 },

  bottomNav: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingHorizontal: 10 },
  navIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
});
