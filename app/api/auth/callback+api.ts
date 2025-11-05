//app/api/auth/callback+api
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const scheme = process.env.EXPO_PUBLIC_APP_SCHEME!;
  const url = new URL(req.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const error = url.searchParams.get("error");

  // Optional: validate state
  const cookieState = req.cookies.get("oauth_state")?.value;
  if (cookieState && state && cookieState !== state) {
    return new NextResponse("State mismatch", { status: 400 });
  }

  // Send back into the native app (and web will be handled by client)
  const deepLink = `${scheme}://auth?code=${encodeURIComponent(
    code
  )}&state=${encodeURIComponent(state)}${
    error ? `&error=${encodeURIComponent(error)}` : ""
  }`;

  return NextResponse.redirect(deepLink);
}
