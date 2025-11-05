import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import AppBackground from "../components/AppBackground";
import { useAuth } from "../context/auth";

const text = "#E6EEF7";
const btnBg = "#152233";
const btnSecondary = "#1F334D";

export default function Registration({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signUpWithEmail, isLoading: loading } = useAuth();

  const onRegister = async () => {
    try {
      if (!email || !password || !confirmPassword) {
        Alert.alert("Missing fields", "Please fill all fields.");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Password mismatch", "Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        Alert.alert("Weak password", "Password must be at least 6 characters.");
        return;
      }

      await signUpWithEmail(email.trim(), password);

      // Clear the form
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      Alert.alert("Success", "Registration complete!");
      // Navigate home or to login as you prefer
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e: any) {
      // Handle common Firebase auth error codes nicely
      const code = e?.code ?? "";
      if (code === "auth/email-already-in-use") {
        Alert.alert("Email in use", "This email is already registered.");
      } else if (code === "auth/invalid-email") {
        Alert.alert("Invalid email", "Please enter a valid email address.");
      } else if (code === "auth/operation-not-allowed") {
        Alert.alert("Auth disabled", "Email/password sign-in is not enabled in Firebase.");
      } else if (code === "auth/weak-password") {
        Alert.alert("Weak password", "Password must be at least 6 characters.");
      } else {
        Alert.alert("Registration failed", e?.message ?? String(e));
      }
      console.log("Registration failed:", code, e?.message);
    }
  };

  return (
    <SafeAreaView style={styles.c}>
      <AppBackground />
      <Text style={styles.h}>Create your account</Text>

      <TextInput
        style={styles.i}
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.i}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.i}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <View style={styles.btnWrap}>
        <TouchableOpacity style={styles.btn} onPress={onRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Creating..." : "Register"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.secondaryBtn]}
          onPress={() => navigation.navigate("Login")}
          disabled={loading}
        >
          <Text style={styles.btnText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: {
    flex: 1,
    padding: 20,
    gap: 14,
    justifyContent: "center",
  },
  h: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
  },
  i: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: "#000",
  },
  btnWrap: {
    marginTop: 10,
    gap: 12,
    paddingHorizontal: 10,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: btnBg,
  },
  secondaryBtn: {
    backgroundColor: btnSecondary,
  },
  btnText: {
    color: text,
    fontWeight: "800",
  },
});