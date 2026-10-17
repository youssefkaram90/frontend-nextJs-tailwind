import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * PATCH /api/tray-transport/:id — correct how many trays went into one tunnel.
 *
 * Carries a body, so it uses `relayBody`: a request the backend refuses must come
 * back with the backend's own sentence, not with "we could not reach the server"
 * (the hand-copied version this replaces re-threw anything that was not a timeout,
 * which reached the user as "Something went wrong. Please try again.").
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/tray-transport/${id}`, "PATCH");
}

/**
 * DELETE /api/tray-transport/:id — undo a tray move.
 *
 * A `GET` used to be exported here too, forwarding to `/tray-transport/{id}` —
 * a path the backend does not serve (it has `GET /tray-transport`, `/pending`,
 * `/sowing/:id` and `/tunnel/:id` only), so the backend answered 404. No client
 * called it either: a single assignment is reached through its sowing or its
 * tunnel. Dropped rather than re-written. (SOW-06 did the same for the equivalent
 * dead `PATCH` on the plans relay.)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/tray-transport/${id}`, "DELETE");
}
