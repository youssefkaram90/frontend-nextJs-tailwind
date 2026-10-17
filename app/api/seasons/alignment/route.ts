import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/**
 * GET /api/seasons/alignment — does the open season still match the calendar?
 *
 * Any signed-in user: the sentence is shown to everyone, but the backend words
 * it for the caller's role (an administrator gets the actionable version).
 */
export async function GET(request: NextRequest) {
  return relay(request, "/seasons/alignment");
}
