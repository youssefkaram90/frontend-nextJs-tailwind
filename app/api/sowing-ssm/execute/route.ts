import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * POST /api/sowing-ssm/execute — record a tunnel sowing.
 *
 * This is the call that deducts seeds and peat and writes the plant stock, so it
 * is exactly where a body mistake used to be reported as *"Could not reach the
 * server"*. The shared `relayBody` keeps the backend's own sentence and only
 * speaks for itself when it genuinely could not connect (SOW-01).
 */
export async function POST(request: NextRequest) {
  return relayBody(request, "/sowing-ssm/execute", "POST");
}
