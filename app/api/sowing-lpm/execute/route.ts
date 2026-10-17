import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * POST /api/sowing-lpm/execute — record a field sowing.
 *
 * Deducts the seeds lot and writes the plan-entry progress, so a refused body
 * has to keep the backend's own sentence rather than "we could not reach the
 * server" (SOW-01).
 */
export async function POST(request: NextRequest) {
  return relayBody(request, "/sowing-lpm/execute", "POST");
}
