import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/**
 * GET /api/sowing-lpm — the season's field (LPM) sowings.
 *
 * `request.nextUrl.search` carries `?q=` through, which the hand-copied version
 * dropped — the search box on the Sowing page filtered nothing (SOW-05).
 */
export async function GET(request: NextRequest) {
  return relay(request, `/sowing-lpm${request.nextUrl.search}`);
}
