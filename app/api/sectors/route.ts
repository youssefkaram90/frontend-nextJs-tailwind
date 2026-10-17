import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  // The list forwards its query string, like every other converted list route.
  return relay(request, `/sectors${request.nextUrl.search}`);
}

export async function POST(request: NextRequest) {
  return relayBody(request, "/sectors");
}
