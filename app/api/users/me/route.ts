import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** GET /api/users/me — the signed-in user, with their permission names. */
export async function GET(request: NextRequest) {
  return relay(request, "/users/me");
}
