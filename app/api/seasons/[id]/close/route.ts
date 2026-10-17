import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  /**
   * The backend insists on a JSON body here (`{ open }`), and an empty one means
   * "close it without opening a new season" — so `{}` is forwarded rather than no
   * body at all, exactly as the hand-rolled copy did.
   */
  const body = await request.json().catch(() => ({}));

  return relay(request, `/seasons/${id}/close`, { method: "POST", body });
}
