import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

/** GET /api/sowing-ssm/:id — one sowing, with its plant stock and tunnel. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/sowing-ssm/${id}`);
}

/**
 * PATCH /api/sowing-ssm/:id — edit a sowing.
 *
 * An edit gives the old seeds and peat back and deducts the new figures, so a
 * rejected body must never be dressed up as a connection problem (SOW-01).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/sowing-ssm/${id}`, "PATCH");
}

/** DELETE /api/sowing-ssm/:id — remove a sowing and return its stock. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/sowing-ssm/${id}`, "DELETE");
}
