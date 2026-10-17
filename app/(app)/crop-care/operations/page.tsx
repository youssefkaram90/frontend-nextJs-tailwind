import { redirect } from "next/navigation";

/**
 * The operation log moved onto the Crop Care page (user, 2026-10-11).
 *
 * Kept as a redirect rather than deleted, so a bookmark or an old link does not
 * land on a 404. The screen itself lives at `/crop-care`.
 */
export default function OperationsRedirect() {
  redirect("/crop-care");
}
