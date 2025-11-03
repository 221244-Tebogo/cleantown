// Login.tsx
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
import {
  loginWithEmail,
  registerWithEmail,
  sendReset,
} from "../services/authService";

import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";
import { ensureUserDoc } from "../services/userProfile"; // ✅ make sure this file exists

WebBrowser.maybeCompleteAuthSession();

type Mode = "login" | "signup";

const BG = "#0B284A";
const WHITE = "#FFFFFF";
const BORDER = "rgba(255,255,255,0.12)";
const PANEL = "rgba(255,255,255,0.06)";

export default function Login() { // ✅ not async
  const [mode, setMode] = React.useState<Mode>("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

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

  // ---------- GOOGLE AUTH ----------
  const redirectUri = makeRedirectUri({ useProxy: true });
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri,
    scopes: ["openid", "profile", "email"],
  });

  React.useEffect(() => {
    (async () => {
      if (response?.type === "success") {
        try {
          setBusy(true);
          const idToken =
            (response as any)?.params?.id_token ||
            (response as any)?.authentication?.idToken;
          if (!idToken) throw new Error("No Google id_token returned");
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);
          // ✅ create user doc after Google sign-in
          if (auth.currentUser) await ensureUserDoc(auth.currentUser);
          setMsg("Signed in with Google.");
        } catch (e: any) {
          Alert.alert("Google sign-in failed", e?.message || String(e));
        } finally {
          setBusy(false);
        }
      }
    })();
  }, [response]);

  const doGoogle = async () => {
    try {
      setBusy(true);
      if (Platform.OS === "web") {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
        if (auth.currentUser) await ensureUserDoc(auth.currentUser); 
        setMsg("Signed in with Google.");
      } else {
        await promptAsync(); // handled in effect above
      }
    } catch (e: any) {
      Alert.alert("Google sign-in failed", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  // ---------- EMAIL / PASSWORD ----------
  const submitEmail = async () => {
    if (!email || !password) {
      setMsg("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email.trim(), password);
        if (auth.currentUser) await ensureUserDoc(auth.currentUser); // ✅ make sure doc exists
        setMsg("Welcome back!");
      } else {
        await registerWithEmail(email.trim(), password, name.trim());
        if (auth.currentUser) await ensureUserDoc(auth.currentUser); // ✅ create doc
        setMsg("Account created.");
      }
    } catch (e: any) {
      Alert.alert(mode === "login" ? "Login failed" : "Sign-up failed", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  // ---------- RESET ----------
  const forgot = async () => {
    if (!email) { setMsg("Enter your email first."); return; }
    setBusy(true);
    try {
      await sendReset(email.trim());
      Alert.alert("Reset email sent", "Check your inbox.");
    } catch (e: any) {
      Alert.alert("Reset failed", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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

          <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: "#34495e" }]} onPress={toggleMode}>
            <Text style={styles.secondaryBtnText}>
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: "#6c757d" }]} onPress={forgot}>
            <Text style={styles.secondaryBtnText}>Forgot password</Text>
          </TouchableOpacity>
        </View>

        {/* Google */}
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.googleBtn, shadow, busy && { opacity: 0.7 }]}
            onPress={doGoogle}
            disabled={busy || (!request && Platform.OS !== "web")}
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
