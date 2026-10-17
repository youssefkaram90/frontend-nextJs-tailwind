import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/**
 * Refresh the session.
 *
 * No body: the refresh token arrives as a cookie, and the ROTATED cookies come
 * back through the relay. The caller (`api.ts` / `api-client.ts`) reads only the
 * status, so there is nothing to interpret here.
 */
export async function POST(request: NextRequest) {
  return relay(request, "/auth/refresh", { method: "POST" });
}
