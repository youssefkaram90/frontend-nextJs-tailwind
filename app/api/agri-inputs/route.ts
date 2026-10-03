import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

/** GET /api/agri-inputs — the products this season is allowed to use (`?q=`). */
export async function GET(request: NextRequest) {
  return relay(request, `/agri-inputs${request.nextUrl.search}`);
}

/** POST /api/agri-inputs — put a catalogue product on this season's list (ADMIN). */
export async function POST(request: NextRequest) {
  return relayBody(request, "/agri-inputs", "POST");
}
