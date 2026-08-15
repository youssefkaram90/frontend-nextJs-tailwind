import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/signin", "/signout"];

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("Authentication")?.value;
  const refreshToken = request.cookies.get("Refresh")?.value;
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Only redirect if both tokens are missing — the refresh token is the real session.
  // A missing access token will be silently refreshed by the API layer on first 401.
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
