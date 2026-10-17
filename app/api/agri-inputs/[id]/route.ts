import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** DELETE /api/agri-inputs/:id — take a product off this season's list (ADMIN). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/agri-inputs/${id}`, { method: "DELETE" });
}
