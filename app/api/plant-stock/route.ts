import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  // Forward the query string so ?q= and ?stage= reach the backend.
  return relay(request, `/plant-stock${request.nextUrl.search}`);
}
