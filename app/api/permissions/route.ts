import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** GET /api/permissions — the whole catalogue (the admin matrix's checkboxes). */
export async function GET(request: NextRequest) {
  return relay(request, "/permissions");
}
