import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** Make this season the open one. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/seasons/${id}/activate`, { method: "PATCH" });
}
