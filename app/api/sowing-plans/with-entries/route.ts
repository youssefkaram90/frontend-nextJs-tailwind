import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * POST /api/sowing-plans/with-entries — create a plan and all of its entries in
 * one transaction, which is what the create-plan form actually uses (a plan
 * with no entries is useless, and a half-created plan would be worse).
 */
export async function POST(request: NextRequest) {
  return relayBody(request, "/sowing-plans/with-entries", "POST");
}
