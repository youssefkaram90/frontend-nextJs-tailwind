import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * Sign out on every device.
 *
 * Needs a live session on the backend — this is the one auth route that does —
 * and takes no body from the web client.
 */
export async function POST(request: NextRequest) {
  return relayBody(request, "/auth/signout-all", "POST");
}
