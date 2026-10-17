import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** GET /api/stock/summary — the totals the stock page's cards show. */
export async function GET(request: NextRequest) {
  return relay(request, "/stock/summary");
}
