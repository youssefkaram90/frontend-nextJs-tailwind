import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/**
 * GET /api/sowing-ssm — the season's tunnel (SSM) sowings.
 *
 * `request.nextUrl.search` carries `?q=` through. The hand-copied version this
 * replaces called the backend at a bare `/sowing-ssm`, so the Sowing page's
 * search box filtered nothing while appearing to work (SOW-05 — the same fault
 * as STOCK-01, U-1 and DEL-1).
 */
export async function GET(request: NextRequest) {
  return relay(request, `/sowing-ssm${request.nextUrl.search}`);
}
