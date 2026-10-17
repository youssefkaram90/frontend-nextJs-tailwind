import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/**
 * Who am I — relayed from `/users/me`.
 *
 * The endpoint lives under the users module, but it is the session read, so it
 * belongs with the other auth routes.
 */
export async function GET(request: NextRequest) {
  return relay(request, "/users/me");
}
