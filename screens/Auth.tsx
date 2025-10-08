import React, { useEffect, useRef, useState } from "react";

import { Alert, Platform, View } from "react-native";
import { Screen, Card, H2, P, Btn, Input } from "../src/ui";
import SignInWithGoogleButton from "../components/SignInWithGoogleButton";

import {
  anonymousLogin,
  loginWithEmail,
  registerWithEmail,
  sendReset,
  signInWithGoogle,
  phoneStart,
  phoneConfirm,
  ensureWebRecaptcha,
} from "../services/authService";


type Mode = "login" | "signup";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");

  // email/password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // phone
  const [phone, setPhone] = useState("+27"); // E.164 format (e.g., +27...)
  const [code, setCode] = useState("");
  const [confirmObj, setConfirmObj] = useState<any>(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Native reCAPTCHA modal ref (only used on iOS/Android)
  const recaptchaRef = useRef<any>(null);

  // Prepare invisible reCAPTCHA on web
  useEffect(() => {
    if (Platform.OS === "web") {
      ensureWebRecaptcha(); // creates a hidden container if needed
    }
  }, []);

  const toggle = () => setMode((m) => (m === "login" ? "signup" : "login"));

  const doAnon = async () => {
    setBusy(true);
    try {
      await anonymousLogin();
      setMsg("Signed in anonymously.");
    } catch (e: any) {
      Alert.alert("Anonymous sign-in failed", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      await signInWithGoogle(); // web uses popup; native uses AuthSession -> Firebase
      setMsg("Signed in with Google.");
    } catch (e: any) {
      Alert.alert("Google sign-in failed", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = async () => {
    if (!email || !password) {
      setMsg("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
        setMsg("Welcome back!");
      } else {
        await registerWithEmail(email, password, name);
        setMsg("Account created.");
      }
    } catch (e: any) {
      Alert.alert(mode === "login" ? "Login failed" : "Sign-up failed", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email) {
      setMsg("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      await sendReset(email);
      Alert.alert("Reset email sent", "Check your inbox for password reset instructions.");
    } catch (e: any) {
      Alert.alert("Reset failed", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    if (!phone || !phone.startsWith("+")) {
      Alert.alert("Invalid phone", "Enter a phone number in E.164 format (e.g., +27...)");
      return;
    }
    setBusy(true);
    try {
      const confirmation = await phoneStart(phone, recaptchaRef); // native uses modal; web uses invisible
      setConfirmObj(confirmation);
      setMsg("Code sent. Check your SMS.");
    } catch (e: any) {
      Alert.alert("Phone auth failed", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async () => {
    if (!confirmObj || !code) {
      setMsg("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    try {
      await phoneConfirm(confirmObj, code);
      setMsg("Phone number verified.");
    } catch (e: any) {
      Alert.alert("Invalid code", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  // Dynamically render the native reCAPTCHA modal only on iOS/Android
  const RecaptchaModal = () => {
    if (Platform.OS === "web") return null;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { FirebaseRecaptchaVerifierModal } = require("expo-firebase-recaptcha");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { app } = require("../firebase");
    return (
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaRef}
        firebaseConfig={app.options as any}
      />
    );
  };

  return (
    <Screen>
      <Card>
        <H2>Welcome to CleanTown</H2>
        <P>Report dumping • Join cleanups • Earn points</P>
      </Card>

      {/* Email / Password */}
      <Card>
        <H2>{mode === "login" ? "Login with Email" : "Create an account"}</H2>
        {mode === "signup" ? (
          <Input
            placeholder="Display name (optional)"
            value={name}
            onChangeText={setName}
            style={{ marginBottom: 10 }}
          />
        ) : null}
        <Input
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={{ marginBottom: 10 }}
        />
        <Input
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ marginBottom: 12 }}
        />
        <Btn onPress={submitEmail}>
          {busy ? (mode === "login" ? "Signing in..." : "Creating...") : mode === "login" ? "Sign in" : "Sign up"}
        </Btn>

        <View style={{ height: 10 }} />
        <Btn onPress={toggle} style={{ backgroundColor: "#34495e" }}>
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </Btn>

        <View style={{ height: 8 }} />
        <Btn onPress={forgot} style={{ backgroundColor: "#6c757d" }}>
          Forgot password
        </Btn>
      </Card>

      {/* Google + Anonymous */}
      <Card>
        <Btn onPress={google} style={{ backgroundColor: "#DB4437", marginBottom: 8 }}>
          Continue with Google
        </Btn>
        <Btn onPress={doAnon} style={{ backgroundColor: "#10b981" }}>
          Continue anonymously
        </Btn>
      </Card>

      {/* Phone auth */}
      <Card>
        <RecaptchaModal />
        <H2>Sign in with Phone</H2>
        <Input
          placeholder="+27..."
          value={phone}
          onChangeText={setPhone}
          style={{ marginBottom: 8 }}
        />
        {!confirmObj ? (
          <Btn onPress={sendCode}>{busy ? "Sending..." : "Send code"}</Btn>
        ) : (
          <>
            <Input
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              style={{ marginTop: 8, marginBottom: 8 }}
            />
            <Btn onPress={confirmCode}>{busy ? "Verifying..." : "Confirm code"}</Btn>
          </>
        )}
      </Card>

      {msg ? (
        <Card>
          <P>{msg}</P>
        </Card>
      ) : null}
    </Screen>
  );
}
