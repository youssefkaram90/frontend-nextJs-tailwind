import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** GET /api/agri-inputs/:id/movements — everything that moved this stock. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/agri-inputs/${id}/movements`);
}
