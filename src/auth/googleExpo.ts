// src/auth/googleExpo.js
// File: src/auth/googleExpo.ts
// Expo Go flow (uses WEB client ID via expoClientId)
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../../firebase";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleExpo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const [request, response, promptAsync] = Google.useAuthRequest({
    responseType: "id_token",
    scopes: ["profile", "email"],
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Expo Go
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
    error,
    signIn: async () => {
      setError(undefined);
      if (!request) return setError("Auth request not ready");
      await promptAsync();
    },
  };
}




// import { signInAnonymously, signOut } from "firebase/auth";
// import { auth } from "../../firebase"; // ensure firebase.ts exports `auth`

// /** Sign in anonymously (creates a temporary Firebase user). */
// export async function anonSignIn() {
//   const cred = await signInAnonymously(auth);
//   return cred.user; // { uid, isAnonymous: true, ... }
// }

// /** Sign out current user. */
// export async function doSignOut() {
//   await signOut(auth);
// }
