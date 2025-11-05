//app/api/auth
import type { NextRequest } from "next/server"; // Expo Router API routes use the same types
import { NextResponse } from "next/server";

const params = (o: Record<string, string>) =>
  Object.entries(o)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

export async function GET(req: NextRequest) {
  const baseUrl = process.env.EXPO_PUBLIC_BASE_URL!;
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;
  const authUrl =
    process.env.EXPO_PUBLIC_GOOGLE_AUTH_URL ||
    "https://accounts.google.com/o/oauth2/v2/auth";

  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/callback`;
  const state = crypto.randomUUID();

  // You can set state in a cookie if you want to validate it on callback
  const url = `${authUrl}?${params({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "openid email profile",
    state,
  })}`;

  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
