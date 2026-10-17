import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/**
 * GET /api/settings — the figures the farm can change without a developer.
 *
 * Readable by anyone who can sign in, and the server decides that rather than this
 * file: the sowing screens need these numbers to show a preview before saving
 * (SOW-11).
 */
export async function GET(request: NextRequest) {
  return relay(request, "/settings");
}
