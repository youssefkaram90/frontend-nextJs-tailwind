import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/**
 * GET /api/stock — the season's stock lots.
 *
 * The search string has to travel: this route used to call the backend at
 * `/stock` with no query at all, so the page's search box filtered nothing while
 * looking like it worked — the list simply never changed (STOCK-01, the same bug
 * as U-1 and DEL-1). `request.nextUrl.search` carries `?q=` through untouched.
 */
export async function GET(request: NextRequest) {
  return relay(request, `/stock${request.nextUrl.search}`);
}
