import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri({ useProxy: true });

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
    redirectUri, // link to my registered expo acc https://auth.expo.io/.......
    scopes: ["openid", "profile", "email"],
  });

  // Debug: confirm the exact URI used
  console.log("Auth redirectUri →", redirectUri);
  console.log("Request redirectUri →", request?.redirectUri);

  return { request, response, promptAsync };
}
