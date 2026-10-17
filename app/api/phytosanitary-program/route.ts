import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  return relay(request, `/phytosanitary-program${request.nextUrl.search}`);
}

export async function POST(request: NextRequest) {
  return relayBody(request, "/phytosanitary-program");
}
