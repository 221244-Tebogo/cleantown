// screens/Profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AppBackground from "../components/AppBackground";
import { getUserDoc, getUserInfo, logoutUser } from "../services/authService";

const YELLOW = "#FBBC05";
const TEXT = "#E6EEF7";
const SUB = "#90A4B8";
const CARD = "#0E1C2C";
const GOOGLE_RED = "#DB4437";

export default function Profile() {
  const navigation = useNavigation<any>();
  const user = getUserInfo();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

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

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await logoutUser();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setUploading(true);
      setImageUri(result.assets[0].uri);
      // TODO: Upload to Firebase Storage & update user doc
      setTimeout(() => setUploading(false), 1500);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <AppBackground />

      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleImagePick} activeOpacity={0.85}>
          <View style={styles.avatar}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
            {uploading && (
              <ActivityIndicator
                color="#000"
                style={{ position: "absolute", alignSelf: "center", top: "45%" }}
              />
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email ?? "-"}</Text>

        {!loading && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.points ?? 120}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.reports ?? 4}</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
          </View>
        )}
      </View>

      {/* Settings Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Row icon="language" label="Language" value="Setswana" />
        <Row icon="megaphone" label="Voice" value="Female" />
        <Row icon="color-palette" label="Customize Theme" onPress={() => {}} />
        <Row icon="options" label="Preferences" onPress={() => {}} />
      </View>

      {/* Footer buttons */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.btnOutlineDestructive, signingOut && { opacity: 0.6 }]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.9}
        >
          {signingOut ? (
            <ActivityIndicator color={GOOGLE_RED} />
          ) : (
            <Text style={styles.btnOutlineDestructiveText}>Sign Out</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeChip}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.9}
        >
          <Ionicons name="home-outline" size={16} color="#0B0F14" style={{ marginRight: 6 }} />
          <Text style={styles.homeChipText}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/** Row Component (same as Settings version) */
function Row({ icon, label, value, onPress }: any) {
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

/** Styles */
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: "center", paddingTop: 32, paddingBottom: 16 },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarText: {
    color: "#0B0F14",
    fontSize: 36,
    fontFamily: "Poppins_600SemiBold",
  },
  avatarImage: { width: "100%", height: "100%" },

  name: {
    color: "#FFFFFF",
    fontSize: 22,
    marginTop: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  email: {
    color: TEXT,
    fontSize: 13,
    opacity: 0.9,
    marginTop: 4,
    fontFamily: "Poppins_400Regular",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    marginTop: 20,
  },
  statCard: {
    alignItems: "center",
  },
  statValue: {
    color: YELLOW,
    fontSize: 22,
    fontFamily: "Poppins_600SemiBold",
  },
  statLabel: {
    color: SUB,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    gap: 8,
  },
  sectionTitle: {
    color: YELLOW,
    fontSize: 14,
    marginBottom: 6,
    fontFamily: "Poppins_500Medium",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowLabel: { color: TEXT, fontSize: 15, fontFamily: "Poppins_500Medium" },
  rowValue: { color: SUB, fontSize: 13, marginRight: 8 },

  bottom: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    marginTop: 20,
    alignItems: "center",
  },
  btnOutlineDestructive: {
    borderWidth: 1,
    borderColor: GOOGLE_RED,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    marginBottom: 14,
  },
  btnOutlineDestructiveText: {
    color: GOOGLE_RED,
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },

  homeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  homeChipText: {
    color: "#0B0F14",
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
});


// import React, { useEffect, useMemo, useState } from "react";
// import {
//   SafeAreaView,
//   View,
//   Text,
//   StyleSheet,
//   Platform,
//   TouchableOpacity,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { getUserInfo, getUserDoc, logoutUser } from "../services/authService";
// import AppBackground from "../components/AppBackground";

// const YELLOW = "#FBBC05";
// const TEXT = "#E6EEF7";
// const SUB = "#BFD0E2";
// const GOOGLE_RED = "#DB4437";

// export default function Profile({ navigation }: any) {
//   const user = getUserInfo();
//   const [profile, setProfile] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [signingOut, setSigningOut] = useState(false);

//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         if (user?.uid) {
//           const d = await getUserDoc(user.uid);
//           if (mounted) setProfile(d);
//         }
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, [user?.uid]);

//   const displayName = useMemo(
//     () =>
//       profile?.name ||
//       user?.displayName ||
//       (user?.email ? user.email.split("@")[0] : "User"),
//     [profile?.name, user?.displayName, user?.email]
//   );

//   const initials = useMemo(() => {
//     const src = profile?.name || user?.displayName || user?.email || "U";
//     const parts = String(src)
//       .replace(/@.*/, "")
//       .split(/\s|\.|_/)
//       .filter(Boolean);
//     const a = parts[0]?.[0] || "U";
//     const b = parts[1]?.[0] || (parts.length > 1 ? parts[parts.length - 1][0] : "");
//     return (a + (b || "")).toUpperCase();
//   }, [profile?.name, user?.displayName, user?.email]);

//   async function onSignOut() {
//     try {
//       setSigningOut(true);
//       await logoutUser();
//       navigation.reset({ index: 0, routes: [{ name: "Login" }] });
//     } finally {
//       setSigningOut(false);
//     }
//   }

//   return (
//     <SafeAreaView style={styles.root}>
//       <AppBackground />
//       {/* Center content (like Login’s logo) */}
//       <View style={styles.center}>
//         <View style={styles.avatar}>
//           <Text style={styles.avatarText}>{initials}</Text>
//         </View>

//         <Text style={styles.name}>{displayName}</Text>
//         <Text style={styles.email}>{user?.email ?? "-"}</Text>

//         {loading ? (
//           <ActivityIndicator style={{ marginTop: 12 }} />
//         ) : (
//           <>
//             {profile?.phone && <Text style={styles.meta}>Phone: {profile.phone}</Text>}
//           </>
//         )}
//       </View>

//       {/* Bottom bar (thumb zone) */}
//       <View style={styles.bottom}>
//         <TouchableOpacity
//           style={styles.btnOutlineDestructive}
//           onPress={onSignOut}
//           activeOpacity={0.9}
//           disabled={signingOut}
//         >
//           {signingOut ? (
//             <ActivityIndicator />
//           ) : (
//             <Text style={styles.btnOutlineDestructiveText}>Sign Out</Text>
//           )}
//         </TouchableOpacity>

//         <View style={styles.utilityRow}>
//           <View style={{ width: 1 }} />
//           <TouchableOpacity
//             style={styles.homeChip}
//             onPress={() => navigation.navigate("Home")}
//             activeOpacity={0.9}
//           >
//             <Ionicons name="home-outline" size={16} color="#0B0F14" style={{ marginRight: 6 }} />
//             <Text style={styles.homeChipText}>Home</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   root: { flex: 1 },
//   center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },

//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: YELLOW,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowRadius: 12,
//     elevation: 6,
//   },
//   avatarText: {
//     color: "#0B0F14",
//     fontSize: 40,
//     letterSpacing: 1,
//     fontFamily: Platform.select({
//       ios: "Poppins-SemiBold",
//       android: "Poppins_600SemiBold",
//       default: "Poppins_600SemiBold",
//     }),
//   },

//   name: {
//     color: "#FFFFFF",
//     fontSize: 24,
//     marginTop: 16,
//     fontFamily: Platform.select({
//       ios: "Poppins-SemiBold",
//       android: "Poppins_600SemiBold",
//       default: "Poppins_600SemiBold",
//     }),
//   },
//   email: {
//     color: TEXT,
//     opacity: 0.9,
//     fontSize: 14,
//     marginTop: 6,
//     fontFamily: Platform.select({
//       ios: "Poppins-Regular",
//       android: "Poppins_400Regular",
//       default: "Poppins_400Regular",
//     }),
//   },
//   meta: {
//     color: SUB,
//     fontSize: 12,
//     marginTop: 6,
//     fontFamily: Platform.select({
//       ios: "Poppins-Regular",
//       android: "Poppins_400Regular",
//       default: "Poppins_400Regular",
//     }),
//   },

//   bottom: { 
//     paddingHorizontal: 16, 
//     paddingBottom: 20, 
//     gap: 12 
//   },

//   btnOutlineDestructive: {
//     borderWidth: 1,
//     borderColor: GOOGLE_RED,
//     borderRadius: 16,
//     paddingVertical: 16,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   btnOutlineDestructiveText: {
//     color: GOOGLE_RED,
//     fontSize: 16,
//     fontFamily: Platform.select({
//       ios: "Poppins-Medium",
//       android: "Poppins_500Medium",
//       default: "Poppins_500Medium",
//     }),
//   },

//   utilityRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginTop: 6,
//   },

//   homeChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 999,
//     backgroundColor: YELLOW,
//   },
//   homeChipText: {
//     color: "#0B0F14",
//     fontSize: 12,
//     fontFamily: Platform.select({
//       ios: "Poppins-Medium",
//       android: "Poppins_500Medium",
//       default: "Poppins_500Medium",
//     }),
//   },
// });
