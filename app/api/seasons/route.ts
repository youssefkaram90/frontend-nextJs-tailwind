import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  // The season list forwards its query string, like every other list route.
  return relay(request, `/seasons${request.nextUrl.search}`);
}

export async function POST(request: NextRequest) {
  return relayBody(request, "/seasons");
}
