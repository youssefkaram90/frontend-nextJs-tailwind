import { redirect } from "next/navigation";

/**
 * "Log an operation" is on the Crop Care page now (user, 2026-10-11) — the form
 * sits at the top of it, so there is nothing to open.
 *
 * Kept as a redirect rather than deleted, so an old link does not land on a 404.
 */
export default function CreateOperationRedirect() {
  redirect("/crop-care");
}
