import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  // The catalogue list forwards its query string (?q…).
  return relay(request, `/phytosanitary-products${request.nextUrl.search}`);
}

export async function POST(request: NextRequest) {
  return relayBody(request, "/phytosanitary-products");
}
