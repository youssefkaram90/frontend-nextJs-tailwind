import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** What closing this season would do — shown before the administrator confirms. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/seasons/${id}/close-preview`);
}
