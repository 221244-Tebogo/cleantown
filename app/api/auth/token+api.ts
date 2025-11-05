import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token?: string;
  scope: string;
  token_type: "Bearer";
};

const now = () => Math.floor(Date.now() / 1000);

export async function POST(req: NextRequest) {
  try {
    const {
      EXPO_PUBLIC_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token",
      EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      EXPO_PUBLIC_GOOGLE_CLIENT_SECRET,
      EXPO_PUBLIC_BASE_URL,
      EXPO_PUBLIC_JWT_SECRET,
    } = process.env;

    const { code } = await req.json();

    const redirect_uri = `${EXPO_PUBLIC_BASE_URL!.replace(
      /\/$/,
      ""
    )}/api/auth/callback`;

    // Exchange code for Google tokens
    const body = new URLSearchParams({
      code,
      client_id: EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: EXPO_PUBLIC_GOOGLE_CLIENT_SECRET!,
      redirect_uri,
      grant_type: "authorization_code",
    });

    const googleRes = await fetch(EXPO_PUBLIC_GOOGLE_TOKEN_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!googleRes.ok) {
      const txt = await googleRes.text();
      return NextResponse.json(
        { error: "google_token_exchange_failed", details: txt },
        { status: 400 }
      );
    }

    const g: GoogleTokenResponse = await googleRes.json();

    // Decode Google ID token (basic claims)
    const googlePayload = JSON.parse(
      Buffer.from(g.id_token.split(".")[1], "base64").toString()
    );

    // Create your app access/refresh tokens
    const accessTtlSec = 60 * 15; // 15m
    const refreshTtlSec = 60 * 60 * 24 * 30; // 30d

    const appAccessToken = jwt.sign(
      {
        sub: googlePayload.sub,
        email: googlePayload.email,
        name: googlePayload.name,
        picture: googlePayload.picture,
        iss: "lentsu",
        typ: "access",
      },
      EXPO_PUBLIC_JWT_SECRET!,
      { expiresIn: accessTtlSec }
    );

    const appRefreshToken = jwt.sign(
      { sub: googlePayload.sub, typ: "refresh" },
      EXPO_PUBLIC_JWT_SECRET!,
      { expiresIn: refreshTtlSec }
    );

    // Return everything the client context needs
    return NextResponse.json({
      user: {
        id: googlePayload.sub,
        email: googlePayload.email,
        name: googlePayload.name,
        picture: googlePayload.picture,
      },
      appAccessToken,
      appAccessTokenExpiresAt: now() + accessTtlSec,
      appRefreshToken,
      appRefreshTokenExpiresAt: now() + refreshTtlSec,
      // (Optionally pass through Google tokens if you’ll call Google APIs directly)
      google: {
        access_token: g.access_token,
        expires_in: g.expires_in,
        id_token: g.id_token,
        refresh_token: g.refresh_token ?? null,
        scope: g.scope,
        token_type: g.token_type,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "token_endpoint_error", details: e?.message },
      { status: 500 }
    );
  }
}
