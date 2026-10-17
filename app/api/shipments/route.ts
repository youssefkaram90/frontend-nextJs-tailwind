import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  // The shipment list forwards its query string, like every other list route.
  return relay(request, `/shipments${request.nextUrl.search}`);
}

export async function POST(request: NextRequest) {
  return relayBody(request, "/shipments");
}
