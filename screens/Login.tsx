// screens/Login.tsx
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
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
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "../components/AppBackground";
import { useAuth } from "../context/auth";

const BG = "#0B284A";
const WHITE = "#FFFFFF";
const BORDER = "rgba(255,255,255,0.12)";
const PANEL = "rgba(255,255,255,0.06)";

type Mode = "login" | "signup";

export default function Login() {
  const [mode, setMode] = React.useState<Mode>("login");
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
  const toggleMode = () => setMode((m) => (m === "login" ? "signup" : "login"));
  const shadow =
    Platform.OS === "web"
      ? { boxShadow: "0px 4px 8px rgba(0,0,0,0.15)" }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
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

  // RESET
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

  // GOOGLE
  const doGoogle = async () => {
    try {
      await googlePromptAsync(); // unified web+native flow (no popups)
    } catch (e: any) {
      Alert.alert("Google sign-in failed", e?.message || String(e));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppBackground />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            contentFit="contain"
            transition={800}
            cachePolicy="memory-disk"
          />
        </View>

        {/* Email / Password */}
        <View style={styles.card}>
          <Text style={styles.h}>{mode === "login" ? "Login with Email" : "Create an account"}</Text>

          {mode === "signup" && (
            <TextInput
              placeholder="Display name (optional)"
              placeholderTextColor="#BFD3EA"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          )}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#BFD3EA"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#BFD3EA"
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

          <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: "#34495e" }]} onPress={toggleMode} disabled={busy}>
            <Text style={styles.secondaryBtnText}>
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: "#6c757d" }]} onPress={forgot} disabled={busy}>
            <Text style={styles.secondaryBtnText}>Forgot password</Text>
          </TouchableOpacity>
        </View>

        {/* Google */}
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.googleBtn, shadow, (busy || !googleRequest) && { opacity: 0.7 }]}
            onPress={doGoogle}
            disabled={busy || !googleRequest}
            activeOpacity={0.9}
          >
            {busy ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <View style={styles.googleRow}>
                <FontAwesome name="google" size={20} color={WHITE} style={{ marginRight: 10 }} />
                <Text style={styles.googleText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {!!msg && (
          <View style={[styles.card, { paddingVertical: 12 }]}>
            <Text style={{ color: WHITE, textAlign: "center" }}>{msg}</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  logoWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  logo: { width: 160, height: 160 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: PANEL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  h: { color: WHITE, fontSize: 18, marginBottom: 10 },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: WHITE,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  primaryBtn: { borderRadius: 12, backgroundColor: "#2d6cdf", paddingVertical: 12, alignItems: "center", marginBottom: 8 },
  primaryBtnText: { color: WHITE, fontSize: 15, fontWeight: "600" },
  secondaryBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  secondaryBtnText: { color: WHITE, fontSize: 14, fontWeight: "600" },
  googleBtn: { borderRadius: 12, backgroundColor: "#DB4437", paddingVertical: 14, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  googleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  googleText: { color: WHITE, fontSize: 16 },
});
