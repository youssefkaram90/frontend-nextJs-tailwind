import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** Finished-goods totals per product — the cards on the harvest page. */
export async function GET(request: NextRequest) {
  return relay(request, `/harvest-records/summary${request.nextUrl.search}`);
}
