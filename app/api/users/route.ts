import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

/** GET /api/users — the staff list; `?q=` narrows it. */
export async function GET(request: NextRequest) {
  // The search box sends `?q=…`: without the search string the backend is asked
  // for every user, so typing a name changed nothing at all (U-1).
  return relay(request, `/users${request.nextUrl.search}`);
}

/** POST /api/users — create a user (ADMIN only). */
export async function POST(request: NextRequest) {
  return relayBody(request, "/users", "POST");
}
