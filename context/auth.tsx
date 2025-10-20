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
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { ensureUserDoc } from "../services/users";

import { auth } from "../firebase";

WebBrowser.maybeCompleteAuthSession(); // required at module top

// ---------------- Types & context ----------------
type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
} | null;

type AuthCtx = {
  user: User;
  isLoading: boolean;
  error?: any;
  ready: boolean;   // Google request hook is mounted
  reason?: string;  // If Google sign-in disabled (missing IDs)
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = (): AuthCtx => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
};

// ---------------- Helpers ----------------
const nameFromEmail = (email?: string | null) =>
  email ? email.split("@")[0]?.replace(/[._-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? null : null;

const mapFirebaseUser = (fb: FBUser | null): User =>
  !fb
    ? null
    : {
        id: fb.uid,
        name: fb.displayName ?? nameFromEmail(fb.email) ?? null,
        email: fb.email ?? null,
        picture: fb.photoURL ?? null,
      };

// ---------------- Env (Expo auto-inlines EXPO_PUBLIC_*) ----------------
const webClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  undefined;

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined;
const expoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || undefined;

// Use Expo proxy for native, direct on web
const USE_PROXY = Platform.OS !== "web";
const redirectUri = AuthSession.makeRedirectUri({ useProxy: USE_PROXY });

// ---------------- Provider ----------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>();
  const [reason, setReason] = useState<string | undefined>();
  const lastProvider = useRef<"google" | "email" | "phone" | "anon" | null>(null);

  // Keep Firebase in sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, fb => setUser(mapFirebaseUser(fb)));
    return () => unsub();
  }, []);

  // Explain missing Google IDs
  useEffect(() => {
    if (Platform.OS === "web" && !webClientId) setReason("Missing Web Google client ID");
    else if (Platform.OS === "ios" && !iosClientId && !expoClientId) setReason("Missing iOS (or Expo) Google client ID");
    else if (Platform.OS === "android" && !androidClientId && !expoClientId) setReason("Missing Android (or Expo) Google client ID");
    else setReason(undefined);
  }, []);

  // Only mount hook when platform has an ID (prevents init crashes)
  const hasId =
    (Platform.OS === "web" && !!webClientId) ||
    (Platform.OS === "ios" && (!!iosClientId || !!expoClientId)) ||
    (Platform.OS === "android" && (!!androidClientId || !!expoClientId));

  // IMPORTANT: ask for both id_token + access_token so we can revoke on native
  const googleConfig: Google.GoogleAuthRequestConfig = {
    redirectUri,
    responseType: "id_token token",
    scopes: ["openid", "profile", "email"],
    selectAccount: true,
    ...(Platform.OS === "web" ? { webClientId } : {}),
    ...(Platform.OS === "ios" ? { iosClientId, expoClientId } : {}),
    ...(Platform.OS === "android" ? { androidClientId, expoClientId } : {}),
  };

  const [request, response, promptAsync] = hasId
    ? Google.useAuthRequest(googleConfig)
    : ([null, null, async () => {}] as unknown as ReturnType<typeof Google.useAuthRequest>);

  const ready = !!request;

  // Store the Google access token (native) so we can revoke on signOut
  const googleAccessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!response) return;
    (async () => {
      try {
        if (response.type === "success") {
          // id_token is for Firebase credential; accessToken is for revocation
          const idToken = (response as any)?.params?.id_token as string | undefined;
          const accessToken = response.authentication?.accessToken as string | undefined;
          if (accessToken) googleAccessTokenRef.current = accessToken;
          if (!idToken) throw new Error("No id_token returned from Google");

          const cred = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, cred);
          lastProvider.current = "google";
          setError(undefined);
        } else if (response.type === "error") {
          setError(response.error);
        }
      } catch (e) {
        setError(e);
      }
    })();
  }, [response]);

  // ------- Public API -------
  const signIn = async () => {
    setError(undefined);
    if (!ready) {
      if (__DEV__ && reason) Alert.alert("Google Sign-in disabled", reason);
      return;
    }
    setIsLoading(true);
    try {
      await promptAsync({
        useProxy: USE_PROXY,
        preferEphemeralSession: true,
        showInRecents: true,
      });
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // If Google on native: revoke the OAuth token so chooser appears next time
      if (Platform.OS !== "web" && lastProvider.current === "google" && googleAccessTokenRef.current) {
        try {
          await AuthSession.revokeAsync(
            { token: googleAccessTokenRef.current, clientId: iosClientId || androidClientId || expoClientId || "" },
            { revocationEndpoint: "https://oauth2.googleapis.com/revoke" }
          );
        } catch {
          // Best-effort revoke; ignore failures
        }
      }
      await fbSignOut(auth);
      googleAccessTokenRef.current = null;
      lastProvider.current = null;
      setUser(null); // flip the gate immediately
    } finally {
      // Optional perf cleanups for WebBrowser on native
      if (Platform.OS !== "web") {
        try {
          await WebBrowser.coolDownAsync();
        } catch {}
      }
    }
  };

  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (fb) => {
    setUser(mapFirebaseUser(fb));
    if (fb) {
      try { await ensureUserDoc(); } catch (e) { console.log("ensureUserDoc:", e); }
    }
  });
  return () => unsub();
}, []);

  // Diagnostics (keep while wiring up; comment out later)
  console.log("Auth redirectUri →", redirectUri);
  console.log("IDs present:", { expo: !!expoClientId, ios: !!iosClientId, android: !!androidClientId, web: !!webClientId });

  const value = useMemo(
    () => ({ user, isLoading, error, ready, reason, signIn, signOut }),
    [user, isLoading, error, ready, reason]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
