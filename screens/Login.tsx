// screens/Login.tsx
import React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import AppBackground from "../components/AppBackground";
import { useAuth } from "../context/auth";
import { Colors, Fonts } from "../constants/theme";

type Mode = "login" | "signup";

export default function Login() {
  const insets = useSafeAreaInsets();

  const [mode, setMode] = React.useState<Mode>("login");
  const [showEmailForm, setShowEmailForm] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [msg, setMsg] = React.useState("");

  const {
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    googleRequest,
    googlePromptAsync,
  } = useAuth();

  const busy = isLoading;

  const shadow =
    Platform.OS === "web"
      ? ({ boxShadow: "0 6px 18px rgba(0,0,0,0.12)" } as any)
      : {
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
        };

  // EMAIL / PASSWORD
  const submitEmail = async () => {
    try {
      if (!email || !password) {
        setMsg("Email and password are required.");
        return;
      }
      if (mode === "login") {
        await signInWithEmail(email.trim(), password);
        setMsg("Welcome back!");
      } else {
        await signUpWithEmail(email.trim(), password, name.trim() || undefined);
        setMsg("Account created.");
      }
    } catch (e: any) {
      const code = e?.code ?? "";
      const message =
        code === "auth/invalid-email" ? "Invalid email address."
        : code === "auth/user-not-found" ? "No account with this email."
        : code === "auth/wrong-password" ? "Incorrect password."
        : code === "auth/email-already-in-use" ? "Email is already registered."
        : e?.message || String(e);
      Alert.alert(mode === "login" ? "Login failed" : "Sign-up failed", message);
    }
  };

  const forgot = async () => {
    if (!email) {
      setMsg("Enter your email first.");
      return;
    }
    try {
      await resetPassword(email.trim());
      Alert.alert("Reset email sent", "Check your inbox.");
    } catch (e: any) {
      Alert.alert("Reset failed", e?.message || String(e));
    }
  };

  const doGoogle = async () => {
    try {
      await googlePromptAsync();
    } catch (e: any) {
      Alert.alert("Google sign-in failed", e?.message || String(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppBackground />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Back chevron (optional) */}
        <View style={[styles.headerRow, { paddingTop: Math.max(8, insets.top) }]}>
          <View style={styles.backCircle}>
            <Ionicons name="chevron-back" size={20} color={Colors.tabIcon} />
          </View>
        </View>

        {/* HERO */}
        <View style={styles.heroWrap}>
          <Image
            source={require("../assets/images/citizen_report.png")} // ✅ your citizen mascot
            style={styles.mascot}
            contentFit="contain"
            transition={600}
          />

          <Text style={styles.title}>Keep Your{"\n"}Town Clean</Text>
          <Text style={styles.subtitle}>Spot it. Snap it. Win.</Text>

          {/* Primary CTAs */}
          <TouchableOpacity
            style={[styles.ctaWhite, shadow]}
            activeOpacity={0.9}
            onPress={() => setShowEmailForm((v) => !v)}
            disabled={busy}
          >
            <Text style={styles.ctaWhiteText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctaWhite, styles.googleBtn, shadow, (busy || !googleRequest) && { opacity: 0.7 }]}
            activeOpacity={0.9}
            onPress={doGoogle}
            disabled={busy || !googleRequest}
          >
            {busy ? (
              <ActivityIndicator color={Colors.textDark} />
            ) : (
              <View style={styles.googleRow}>
                {/* Simple colored G using Ionicon as placeholder; swap to an asset if you have it */}
                <Ionicons name="logo-google" size={18} color="#4285F4" style={{ marginRight: 10 }} />
                <Text style={styles.googleText}>Sign In with Google</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* EMAIL FORM (collapsible) */}
        {showEmailForm && (
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>{mode === "login" ? "Login with Email" : "Create an account"}</Text>

            {mode === "signup" && (
              <TextInput
                placeholder="Display name (optional)"
                placeholderTextColor="#90A4B8"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            )}

            <TextInput
              placeholder="Email"
              placeholderTextColor="#90A4B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#90A4B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            <TouchableOpacity style={[styles.primaryBtn, shadow]} onPress={submitEmail} disabled={busy}>
              <Text style={styles.primaryBtnText}>
                {busy ? (mode === "login" ? "Signing in..." : "Creating...") : mode === "login" ? "Sign in" : "Sign up"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => setMode((m) => (m === "login" ? "signup" : "login"))} disabled={busy}>
              <Text style={styles.linkText}>
                {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={forgot} disabled={busy}>
              <Text style={styles.linkText}>Forgot password</Text>
            </TouchableOpacity>
          </View>
        )}

        {!!msg && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={{ color: "#E6EEF7", textAlign: "center" }}>{msg}</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  headerRow: {
    paddingHorizontal: 16,
  },
  backCircle: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: "rgba(28,37,48,0.25)",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    alignSelf: "flex-start",
  },

  heroWrap: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  mascot: { width: 320, height: 260 },

  title: {
    textAlign: "center",
    color: Colors.textDark,            // #0B0F14
    fontSize: 36,
    lineHeight: 40,
    fontFamily: Fonts.h1,              // Cherry Bomb
    marginTop: 6,
  },
  subtitle: {
    textAlign: "center",
    color: "#263645",
    opacity: 0.85,
    fontSize: 16,
    marginTop: 6,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },

  ctaWhite: {
    marginTop: 16,
    alignSelf: "stretch",
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaWhiteText: {
    color: Colors.textDark,
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },

  googleBtn: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  googleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  googleText: { color: "#6A7A8C", fontSize: 16, fontFamily: "Poppins_500Medium" },

  formCard: {
    marginTop: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  formHeading: {
    color: Colors.textDark,
    fontSize: 18,
    marginBottom: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    color: Colors.textDark,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },

  primaryBtn: {
    borderRadius: 16,
    backgroundColor: Colors.brand, // #72C55D
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: {
    color: "#0B0F14",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },

  linkBtn: { paddingVertical: 8, alignItems: "center" },
  linkText: { color: Colors.textDark, opacity: 0.9, fontSize: 13, fontFamily: "Poppins_500Medium" },
});
