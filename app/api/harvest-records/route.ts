import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  // The records list forwards its query string (?q, ?page, ?targetType…).
  return relay(request, `/harvest-records${request.nextUrl.search}`);
}

export async function POST(request: NextRequest) {
  return relayBody(request, "/harvest-records");
}
