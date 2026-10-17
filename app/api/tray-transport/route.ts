import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

/**
 * GET /api/tray-transport — every tray assignment of the season.
 *
 * `request.nextUrl.search` travels with it. The hand-copied version this replaces
 * forwarded the bare path, while the backend's `findAll(page, pageSize)` accepts
 * paging — so a page request could never have worked. No client asks for one
 * today (both fetch the whole season), but the relay must not be the reason it can
 * never be added.
 */
export async function GET(request: NextRequest) {
  return relay(request, `/tray-transport${request.nextUrl.search}`);
}

/**
 * POST /api/tray-transport — move trays into tunnels.
 *
 * The season rule for this call lives in the **service**, not in an interceptor,
 * because the ids travel in the body and the route cannot name the record it
 * touches (TRAY-03). Nothing path-based belongs in this file.
 */
export async function POST(request: NextRequest) {
  return relayBody(request, "/tray-transport", "POST");
}
