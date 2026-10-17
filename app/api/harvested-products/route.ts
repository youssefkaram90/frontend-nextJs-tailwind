import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  // Forwards its query string, like every other list route.
  return relay(request, `/harvested-products${request.nextUrl.search}`);
}
