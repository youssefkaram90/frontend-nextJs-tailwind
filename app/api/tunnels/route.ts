import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  // The list forwards its query string — the service can send `?q=`.
  return relay(request, `/tunnels${request.nextUrl.search}`);
}

export async function POST(request: NextRequest) {
  return relayBody(request, "/tunnels");
}
