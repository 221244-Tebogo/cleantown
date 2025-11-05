import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";

import AppBackground from "../components/AppBackground";
import { Colors, Fonts, Radii } from "../constants/theme";
import { getUserDoc, getUserInfo, logoutUser } from "../services/authService";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";


import { useUserPoints } from "../services/points";

const BADGE_GOLD = require("../assets/images/Gold.png");

export default function Profile() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const authUser = getUserInfo();            // firebase auth user
  const uid = authUser?.uid;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Points (live)
  const [points, setPoints] = useState<number>(0);
  // If you have a centralised points hook, use it instead:
  // const points = useUserPoints(uid);

  // Load profile & subscribe to points
  useEffect(() => {
    let unsub: undefined | (() => void);
    let mounted = true;

    (async () => {
      try {
        if (uid) {
          const d = await getUserDoc(uid);
          if (mounted) setProfile(d ?? {});
          // live points from users/{uid}.totalPoints
          unsub = onSnapshot(doc(db, "users", uid), (snap) => {
            const data = snap.data() as any;
            setPoints(Number(data?.totalPoints ?? 0));
          });
        }
      } catch (e) {
        console.warn("Profile load error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [uid]);

  const displayName = useMemo(
    () =>
      profile?.name ||
      authUser?.displayName ||
      (authUser?.email ? authUser.email.split("@")[0] : "Eco Hero"),
    [profile?.name, authUser?.displayName, authUser?.email]
  );

  const initials = useMemo(() => {
    const src = profile?.name || authUser?.displayName || authUser?.email || "U";
    const parts = String(src).replace(/@.*/, "").split(/\s|\.|_/).filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts[1]?.[0] || (parts.length > 1 ? parts[parts.length - 1][0] : "");
    return (a + (b || "")).toUpperCase();
  }, [profile?.name, authUser?.displayName, authUser?.email]);

  // Gamification bits
  const level = useMemo(() => levelFrom(points), [points]);
  const progressPct = useMemo(() => progressToNext(points), [points]);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await logoutUser();
      nav.reset({ index: 0, routes: [{ name: "Login" }] });
    } finally {
      setSigningOut(false);
    }
  }

  async function handleImagePick() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow gallery access to upload a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setUploading(true);
      setImageUri(result.assets[0].uri);
      // TODO: upload to Firebase Storage + update user doc photoURL
      setTimeout(() => setUploading(false), 1200);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <AppBackground />

      {/* HEADER HERO */}
      <View style={[styles.hero, { paddingTop: Math.max(20, insets.top + 8) }]}>
        {/* Points pill */}
        <View style={styles.pointsPill}>
          <Image source={BADGE_GOLD} style={{ width: 18, height: 18, marginRight: 6 }} />
          <Text style={styles.pointsText}>{points}</Text>
        </View>

        {/* Avatar */}
        <TouchableOpacity onPress={handleImagePick} activeOpacity={0.9}>
          <View style={styles.avatar}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
            {uploading && <ActivityIndicator color="#000" style={styles.avatarLoader} />}
          </View>
        </TouchableOpacity>

        {/* Name + Email */}
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{authUser?.email ?? "-"}</Text>

        {/* Level chip */}
        <View style={styles.levelChip}>
          <MaterialCommunityIcons name="shield-star" size={16} color="#fff" />
          <Text style={styles.levelChipText}>Level {level}</Text>
        </View>

        {/* Progress to next level */}
        <View style={styles.progressWrap}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        {/* Quick stats */}
        {!loading && (
          <View style={styles.statsRow}>
            <StatCard icon="trophy" label="Points" value={points} />
            <StatCard icon="camera" label="Reports" value={profile?.reports ?? 0} />
            <StatCard icon="map" label="Cleanups" value={profile?.cleanups ?? 0} />
          </View>
        )}
      </View>

      {/* SETTINGS CARD */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Row icon="language" label="Language" value={profile?.language || "Setswana"} />
        <Row icon="megaphone" label="Voice" value={profile?.voice || "Female"} />
        <Row icon="color-palette" label="Theme" onPress={() => {}} />
        <Row icon="lock-closed" label="Privacy" onPress={() => {}} />
      </View>

      {/* ACTIONS */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.btnOutlineDanger, signingOut && { opacity: 0.7 }]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.9}
        >
          {signingOut ? <ActivityIndicator color="#DB4437" /> : <Text style={styles.btnOutlineDangerText}>Sign Out</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeChip} onPress={() => nav.navigate("Home")} activeOpacity={0.9}>
          <Ionicons name="home-outline" size={16} color="#0B0F14" style={{ marginRight: 6 }} />
          <Text style={styles.homeChipText}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ---------- Pieces ---------- */

function StatCard({ icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={18} color={Colors.brand} />
      </View>
      <Text style={styles.statValue}>{value ?? 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({ icon, label, value, onPress }: any) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={Colors.brand} style={{ marginRight: 10 }} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {!!value && <Text style={styles.rowValue}>{String(value)}</Text>}
      <Ionicons name="chevron-forward" size={18} color={Colors.textSub} />
    </TouchableOpacity>
  );
}

/* ---------- Helpers ---------- */

function levelFrom(total: number) {
  // simple curve: every 100 pts = 1 level (1..∞)
  return Math.max(1, Math.floor(total / 100) + 1);
}
function progressToNext(total: number) {
  const into = total % 100;
  return Math.min(100, Math.max(0, into));
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  hero: { alignItems: "center", paddingBottom: 10 },

  pointsPill: {
    position: "absolute",
    right: 16,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  pointsText: { fontWeight: "800", color: Colors.brand },

  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.homeMainBottom,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: {
    color: "#0B0F14",
    fontSize: 36,
    fontFamily: Platform.select({ ios: "Poppins-SemiBold", android: "Poppins_600SemiBold", default: "Poppins_600SemiBold" }),
  },
  avatarLoader: { position: "absolute", alignSelf: "center", top: "45%" },

  name: {
    color: "#FFFFFF",
    fontSize: 22,
    marginTop: 12,
    fontFamily: Platform.select({ ios: "Poppins-SemiBold", android: "Poppins_600SemiBold", default: "Poppins_600SemiBold" }),
  },
  email: {
    color: Colors.textSub,
    fontSize: 13,
    marginTop: 2,
    fontFamily: Platform.select({ ios: "Poppins-Regular", android: "Poppins_400Regular", default: "Poppins_400Regular" }),
  },

  levelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 10,
  },
  levelChipText: { color: "#fff", fontWeight: "800" },

  progressWrap: {
    width: 220,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.brand,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  statCard: {
    width: 98,
    borderRadius: Radii.lg,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    paddingVertical: 12,
  },
  statIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(114,197,93,0.15)",
    marginBottom: 8,
  },
  statValue: {
    color: Colors.textDark,
    fontSize: 18,
    fontFamily: Platform.select({ ios: "Poppins-SemiBold", android: "Poppins_600SemiBold", default: "Poppins_600SemiBold" }),
  },
  statLabel: {
    color: Colors.textSub,
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.select({ ios: "Poppins-Regular", android: "Poppins_400Regular", default: "Poppins_400Regular" }),
  },

  card: {
    backgroundColor: "rgba(13, 22, 34, 0.7)",
    borderRadius: Radii.lg,
    padding: 12,
    marginHorizontal: 16,
    gap: 8,
    marginTop: 16,
  },
  sectionTitle: {
    color: Colors.brand,
    fontSize: 14,
    marginBottom: 6,
    fontFamily: Platform.select({ ios: "Poppins-Medium", android: "Poppins_500Medium", default: "Poppins_500Medium" }),
  },

  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowLabel: {
    color: "#E6EEF7",
    fontSize: 15,
    fontFamily: Platform.select({ ios: "Poppins-Medium", android: "Poppins_500Medium", default: "Poppins_500Medium" }),
  },
  rowValue: { color: Colors.textSub, fontSize: 13, marginRight: 8 },

  bottom: { paddingHorizontal: 16, paddingBottom: 20, marginTop: 18, alignItems: "center", gap: 12 },
  btnOutlineDanger: {
    borderWidth: 2,
    borderColor: "#DB4437",
    borderRadius: Radii.lg,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
  },
  btnOutlineDangerText: {
    color: "#DB4437",
    fontSize: 15,
    fontFamily: Platform.select({ ios: "Poppins-Medium", android: "Poppins_500Medium", default: "Poppins_500Medium" }),
  },

  homeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.brand,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  homeChipText: {
    color: "#0B0F14",
    fontSize: 13,
    fontFamily: Platform.select({ ios: "Poppins-Medium", android: "Poppins_500Medium", default: "Poppins_500Medium" }),
  },
});
