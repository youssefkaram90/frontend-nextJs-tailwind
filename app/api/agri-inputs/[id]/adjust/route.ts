import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/** POST /api/agri-inputs/:id/adjust — a signed stock movement (ADMIN). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/agri-inputs/${id}/adjust`, "POST");
}
