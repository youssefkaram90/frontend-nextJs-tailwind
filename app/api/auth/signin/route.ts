import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * Sign in.
 *
 * The credentials go through untouched, and the backend's `Set-Cookie` headers
 * MUST come back out: the session cookies belong to this origin, which is why the
 * browser never calls the API directly.
 */
export async function POST(request: NextRequest) {
  return relayBody(request, "/auth/signin", "POST");
}
