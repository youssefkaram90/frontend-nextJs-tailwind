import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** GET /api/agri-inputs/:id — one season row, with its product. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/agri-inputs/${id}`);
}

/** DELETE /api/agri-inputs/:id — take a product off this season's list (ADMIN). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/agri-inputs/${id}`, { method: "DELETE" });
}
