import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/**
 * GET /api/sowing-plans/pending-entries — the plan lines still waiting to be
 * sown, grouped by plan. This is the first panel on the Sowing page.
 *
 * **This file did not exist**, so the call answered a Next.js 404 and the backend
 * was never asked: the panel was permanently, silently empty on the web while the
 * phone showed a full list (SOW-02). The page even contains a comment noting that
 * the list is not cached by react-query and is refreshed by hand — which is why
 * nothing looked broken.
 */
export async function GET(request: NextRequest) {
  return relay(request, "/sowing-plans/pending-entries");
}
