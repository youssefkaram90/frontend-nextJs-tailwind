import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * Sign out.
 *
 * The body is optional: the phone puts its refresh token there, the web sends
 * the cookie. Either way the backend clears both cookies, so whatever it answers
 * has to come back through the relay.
 */
export async function POST(request: NextRequest) {
  return relayBody(request, "/auth/signout", "POST");
}
