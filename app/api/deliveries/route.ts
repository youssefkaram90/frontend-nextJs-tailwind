import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

/** GET /api/deliveries — the season's deliveries; `?q=` narrows it. */
export async function GET(request: NextRequest) {
  // The search box sends `?q=…`: without the search string the backend is asked
  // for every delivery, so typing anything changed nothing (DEL-1).
  return relay(request, `/deliveries${request.nextUrl.search}`);
}

/** POST /api/deliveries — record a delivery and its lots. */
export async function POST(request: NextRequest) {
  return relayBody(request, "/deliveries", "POST");
}
