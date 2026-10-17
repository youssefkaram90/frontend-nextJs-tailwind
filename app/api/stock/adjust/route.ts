import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * POST /api/stock/adjust — an ADMIN-only manual movement (opening balance,
 * return, waste, correction).
 *
 * `relayBody`, not a local copy of the relay: this file used to declare its own
 * `relay()` function — the same 40 lines under a name that already means
 * something else in this app, with one behaviour difference that mattered. Its
 * `request.json()` sat inside the shared `try`, so a malformed or empty request
 * body was reported to the user as "Could not reach the server", which is not
 * what happened: the server was never asked (STOCK-06).
 */
export async function POST(request: NextRequest) {
  return relayBody(request, "/stock/adjust", "POST");
}
