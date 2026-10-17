import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

/**
 * GET /api/sowing-plans — the season's plans.
 *
 * The query string travels with the request. The hand-copied version called
 * `/sowing-plans` with no search at all, so the search box on the Plans page
 * filtered nothing while looking as though it worked (SOW-05).
 */
export async function GET(request: NextRequest) {
  return relay(request, `/sowing-plans${request.nextUrl.search}`);
}

/** POST /api/sowing-plans — create an empty plan. */
export async function POST(request: NextRequest) {
  return relayBody(request, "/sowing-plans", "POST");
}
