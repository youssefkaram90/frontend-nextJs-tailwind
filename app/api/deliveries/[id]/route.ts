import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

/** GET /api/deliveries/:id — one delivery with its lots. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/deliveries/${id}`);
}

/** PATCH /api/deliveries/:id — replace the delivery's fields and lots. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/deliveries/${id}`, "PATCH");
}

/** DELETE /api/deliveries/:id — remove it (refused while its stock is used). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/deliveries/${id}`, "DELETE");
}
