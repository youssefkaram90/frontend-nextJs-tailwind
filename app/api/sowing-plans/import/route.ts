import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * POST /api/sowing-plans/import — build a plan from an uploaded Excel file, which
 * the form sends as base64.
 *
 * **This file did not exist**, so "Import from Excel" could never have worked on
 * the web. What the user saw was the generic *"Something went wrong. Please try
 * again."* — which reads like a backend fault and invites a pointless retry
 * (SOW-03). The backend route has been there all along.
 */
export async function POST(request: NextRequest) {
  return relayBody(request, "/sowing-plans/import", "POST");
}
