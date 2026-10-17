import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/**
 * GET /api/tray-transport/pending — the sowings whose trays are still waiting to
 * be moved into a tunnel.
 *
 * **This file did not exist**, which made the whole web tray-transport page dead:
 * all three calls in `sowing/tray-transport/page.tsx` answered a Next.js 404 and
 * the backend never saw a request, so no permission was checked either. The phone
 * was unaffected because it calls the backend directly (SOW-04).
 */
export async function GET(request: NextRequest) {
  return relay(request, "/tray-transport/pending");
}
