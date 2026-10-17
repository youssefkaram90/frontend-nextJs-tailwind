import { NextRequest, NextResponse } from "next/server";

/**
 * Pages reachable without a session.
 *
 * Only `/signin`, which the redirect below sends people to. `/signout` used to
 * be listed here too, but no such page has ever existed — an allowance for a
 * route that isn't there is just a hole waiting to be noticed (AUTH-20). The
 * sign-out itself is a POST to `/api/auth/signout` from the header button.
 */
const publicPaths = ["/signin"];

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
    // Keep the destination so signing in returns the user to the screen they
    // asked for (AUTH-17). The sign-in page validates it before using it.
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("next", pathname + request.nextUrl.search);

    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
