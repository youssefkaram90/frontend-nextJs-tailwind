import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  // The plans list forwards its query string (?q, ?page…).
  return relay(request, `/crop-care-plans${request.nextUrl.search}`);
}

export async function POST(request: NextRequest) {
  return relayBody(request, "/crop-care-plans");
}
