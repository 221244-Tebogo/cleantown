// File: src/auth/googleNative.tsx
// File: src/auth/googleNative.tsx
// Native dev/standalone flow (uses iOS/Android client IDs)
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { auth } from "../../firebase";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleNative() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const cfg = useMemo(() => {
    const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const android = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
    const ready = Platform.OS === "ios" ? !!ios : Platform.OS === "android" ? !!android : false;
    const reason = ready ? undefined : "Missing iOS/Android Google client ID in .env";
    return { ios, android, ready, reason };
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    responseType: "id_token",
    scopes: ["profile", "email"],
    iosClientId: cfg.ios ?? undefined,
    androidClientId: cfg.android ?? undefined,
  });

  useEffect(() => {
    (async () => {
      if (response?.type !== "success") return;
      const idToken = response.params.id_token as string | undefined;
      const accessToken = response.params.access_token as string | undefined;
      if (!idToken && !accessToken) {
        setError("Google returned no tokens");
        return;
      }
      try {
        setLoading(true);
        const cred = GoogleAuthProvider.credential(idToken, accessToken);
        await signInWithCredential(auth, cred);
      } catch (e: any) {
        setError(e?.message || "Firebase sign-in failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [response]);

  return {
    loading,
    error: error ?? (!cfg.ready ? cfg.reason : undefined),
    signIn: async () => {
      if (!cfg.ready) return;
      if (!request) return setError("Auth request not ready");
      await promptAsync();
    },
  };
}

// import * as Google from "expo-auth-session/providers/google";
// import * as WebBrowser from "expo-web-browser";
// import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
// import { useEffect, useMemo, useState } from "react";
// import { Platform } from "react-native";
// import { auth } from "../../firebase"; // <- fixed path

// WebBrowser.maybeCompleteAuthSession();

// type UseGoogleSignInResult = {
//   signIn: () => Promise<void>;
//   loading: boolean;
//   ready: boolean;
//   error?: string;
//   reason?: string;
// };

// export function useGoogleSignIn(): UseGoogleSignInResult {
//   const [error, setError] = useState<string>();
//   const [loading, setLoading] = useState(false);

//   const cfg = useMemo(() => {
//     const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
//     const android = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
//     const expo = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID; // usable for Expo Go
//     const ready = Boolean(
//       Platform.OS === "ios" ? ios : Platform.OS === "android" ? android : expo
//     );
//     const reason = ready ? undefined : "Missing Google client ID(s) in env";
//     return { ios, android, expo, ready, reason };
//   }, []);

//   const [request, response, promptAsync] = Google.useAuthRequest({
//     responseType: "id_token",
//     scopes: ["profile", "email"],
//     iosClientId: cfg.ios ?? undefined,
//     androidClientId: cfg.android ?? undefined,
//     expoClientId: cfg.expo ?? undefined,
//   });

//   useEffect(() => {
//     (async () => {
//       if (response?.type !== "success") return;
//       const idToken = response.params.id_token as string | undefined;
//       const accessToken = response.params.access_token as string | undefined;
//       if (!idToken && !accessToken) {
//         setError("Google returned no tokens");
//         return;
//       }
//       try {
//         setLoading(true);
//         const cred = GoogleAuthProvider.credential(idToken, accessToken);
//         await signInWithCredential(auth, cred);
//       } catch (e: any) {
//         setError(e?.message || "Firebase sign-in failed");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [response]);

//   const signIn = async () => {
//     setError(undefined);
//     if (!cfg.ready) {
//       setError(cfg.reason);
//       return;
//     }
//     if (Platform.OS === "web") {
//       setError("Use web popup flow on web");
//       return;
//     }
//     if (!request) {
//       setError("Auth request not ready");
//       return;
//     }
//     setLoading(true);
//     try {
//       await promptAsync();
//     } catch (e: any) {
//       setError(e?.message || "Google sign-in canceled");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { signIn, loading, ready: cfg.ready, error, reason: cfg.reason };
// }

// export default useGoogleSignIn;
