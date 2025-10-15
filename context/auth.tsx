// context/auth.tsx
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  signOut as fbSignOut,
  User as FBUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import { auth } from "../firebase";
import { upsertUser } from "../services/userService";

WebBrowser.maybeCompleteAuthSession(); // must be top-level

// ---------------- Types & context ----------------
type User = { id: string; name?: string | null; email?: string | null; picture?: string | null } | null;
type AuthCtx = {
  user: User;
  isLoading: boolean;
  error?: any;
  ready: boolean;          // request is mounted & can be used
  reason?: string;         // why sign-in is disabled (missing IDs, etc.)
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ---------------- Helpers ----------------
function nameFromEmail(email?: string | null) {
  if (!email) return null;
  const raw = (email.split("@")[0] ?? "").replace(/[._-]+/g, " ").trim();
  return raw ? raw.replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}
function mapFirebaseUser(fb: FBUser | null): User {
  if (!fb) return null;
  return {
    id: fb.uid,
    name: fb.displayName ?? nameFromEmail(fb.email) ?? null,
    email: fb.email ?? null,
    picture: fb.photoURL ?? null,
  };
}

// ---------------- Env (Expo auto-inlines EXPO_PUBLIC_*) ----------------
// Web client ID: support both names
const webClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  undefined;

// Native client IDs (from Google Cloud OAuth)
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined;

// Optional Expo Go client ID (only if you created one); safe to omit.
const expoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || undefined;

// Redirect URI: use Expo proxy on native, direct origin on web
const USE_PROXY = Platform.OS !== "web";
const redirectUri = AuthSession.makeRedirectUri({ useProxy: USE_PROXY });

// ---------------- Provider ----------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<any>();
  const [reason, setReason] = useState<string | undefined>();

  // Keep Firebase in sync with app state
  useEffect(() => onAuthStateChanged(auth, (fb) => setUser(mapFirebaseUser(fb))), []);

  // Tell the UI why the button might be disabled
  useEffect(() => {
    if (Platform.OS === "web" && !webClientId) setReason("Missing Web Google client ID");
    else if (Platform.OS === "ios" && !iosClientId && !expoClientId) setReason("Missing iOS (or Expo) Google client ID");
    else if (Platform.OS === "android" && !androidClientId && !expoClientId) setReason("Missing Android (or Expo) Google client ID");
    else setReason(undefined);
  }, []);

  // Only mount the hook when the current platform has an ID to prevent the
  // “Client Id property `<id>` must be defined” crash on that platform.
  const hasId =
    (Platform.OS === "web" && !!webClientId) ||
    (Platform.OS === "ios" && (!!iosClientId || !!expoClientId)) ||
    (Platform.OS === "android" && (!!androidClientId || !!expoClientId));

  // Build per-platform config
  const googleConfig: Google.GoogleAuthRequestConfig = {
    redirectUri,
    responseType: "id_token", // we need an ID token for Firebase
    scopes: ["openid", "profile", "email"],
    selectAccount: true,
    ...(Platform.OS === "web" ? { webClientId } : {}),
    ...(Platform.OS === "ios" ? { iosClientId, expoClientId } : {}),
    ...(Platform.OS === "android" ? { androidClientId, expoClientId } : {}),
  };

  // NOTE: Using a conditional hook is generally discouraged, but here it avoids
  // the library throwing during initialization when IDs are missing in dev.
  const [request, response, promptAsync] = hasId
    ? Google.useAuthRequest(googleConfig)
    : ([null, null, async () => {}] as unknown as ReturnType<typeof Google.useAuthRequest>);

  const ready = !!request;

  // Handle sign-in result
  useEffect(() => {
    if (!response) return;
    (async () => {
      try {
        if (response.type === "success") {
          // @ts-ignore – params is typed loosely by the lib
          const idToken: string | undefined = response.params?.id_token;
          // Access token is optional for Firebase; include if present
          const accessToken = response.authentication?.accessToken as string | undefined;
          if (!idToken) throw new Error("No id_token returned from Google");

          const cred = GoogleAuthProvider.credential(idToken, accessToken);
        const userCred = await signInWithCredential(auth, cred);

await upsertUser(userCred.user.uid, {
  name: userCred.user.displayName ?? nameFromEmail(userCred.user.email) ?? "CleanTown User",
  email: userCred.user.email ?? null,
  photoURL: userCred.user.photoURL ?? null,
  phoneNumber: userCred.user.phoneNumber ?? null,
  role: "user",
});

setUser(mapFirebaseUser(userCred.user));
setError(undefined);


        } else if (response.type === "error") {
          setError(response.error);
        } // cancel/dismiss → ignore
      } catch (e) {
        setError(e);
      }
    })();
  }, [response]);

  // Public API
  const signIn = async () => {
    setError(undefined);
    if (!ready) {
      if (__DEV__ && reason) Alert.alert("Google Sign-in disabled", reason);
      return;
    }
    setLoading(true);
    try {
      await promptAsync({ useProxy: USE_PROXY, preferEphemeralSession: true, showInRecents: true });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  // Diagnostics (safe to keep while setting up)
  console.log("Auth redirectUri →", redirectUri);
  console.log("Request redirectUri →", (request as any)?.redirectUri);
  console.log("IDs present:", { expo: !!expoClientId, ios: !!iosClientId, android: !!androidClientId, web: !!webClientId });

  const value = useMemo(
    () => ({ user, isLoading, error, ready, reason, signIn, signOut }),
    [user, isLoading, error, ready, reason]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
