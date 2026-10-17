import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

/** GET /api/sowing-lpm/:id — one field sowing. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/sowing-lpm/${id}`);
}

/** PATCH /api/sowing-lpm/:id — edit a field sowing (stock is moved both ways). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/sowing-lpm/${id}`, "PATCH");
}

/** DELETE /api/sowing-lpm/:id — remove a field sowing and return its seeds. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/sowing-lpm/${id}`, "DELETE");
}
