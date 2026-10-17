import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** The compliance report — a report, so its filters would come as query strings. */
export async function GET(request: NextRequest) {
  return relay(request, `/phytosanitary-compliance${request.nextUrl.search}`);
}
