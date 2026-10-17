import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * Save the readings of a plant count (trays for SSM, 1-metre row samples for LPM).
 *
 * PUT: the body is the whole list of readings for that batch and tunnel — the
 * count IS its readings (PSTOCK-24, decided 2026-10-11).
 *
 * The method is named explicitly. `relayBody` DEFAULTS to POST, it does not pass
 * the caller's method through — leaving it out here sent a POST to a route that
 * only answers PUT, and the screen reported the backend's bare
 * "Cannot POST /api/plant-stock/<id>/counts".
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/plant-stock/${id}/counts`, "PUT");
}
