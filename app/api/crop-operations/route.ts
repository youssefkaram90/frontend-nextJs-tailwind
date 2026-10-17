import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  // The operations list forwards its query string (?q, ?page, ?operationType…).
  return relay(request, `/crop-operations${request.nextUrl.search}`);
}

export async function POST(request: NextRequest) {
  return relayBody(request, "/crop-operations");
}
