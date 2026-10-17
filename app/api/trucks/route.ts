import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  // The fleet list forwards its query string, like every other list.
  return relay(request, `/trucks${request.nextUrl.search}`);
}

export async function POST(request: NextRequest) {
  return relayBody(request, "/trucks");
}
