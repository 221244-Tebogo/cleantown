import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const now = () => Math.floor(Date.now() / 1000);

export async function POST(req: NextRequest) {
  try {
    const { EXPO_PUBLIC_JWT_SECRET } = process.env;
    const { refreshToken } = await req.json();

    const decoded = jwt.verify(refreshToken, EXPO_PUBLIC_JWT_SECRET!) as any;
    if (decoded.typ !== "refresh") {
      return NextResponse.json(
        { error: "invalid_refresh_token" },
        { status: 400 }
      );
    }

    // mint new access token
    const accessTtlSec = 60 * 15;
    const appAccessToken = jwt.sign(
      { sub: decoded.sub, iss: "lentsu", typ: "access" },
      EXPO_PUBLIC_JWT_SECRET!,
      { expiresIn: accessTtlSec }
    );

    return NextResponse.json({
      appAccessToken,
      appAccessTokenExpiresAt: now() + accessTtlSec,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "refresh_failed", details: e?.message },
      { status: 401 }
    );
  }
}
