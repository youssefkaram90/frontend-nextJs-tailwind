"use client";

import { AlertTriangle } from "lucide-react";
import { useSeasonAlignment } from "@/app/lib/hooks/use-seasons";

/**
 * The "your open season does not match the calendar" notice.
 *
 * Shown sitewide, above every page, because the mistake it reports is otherwise
 * invisible: records keep being stamped with a season that has already ended.
 *
 * Deliberately NOT dismissible — it is rare, and it means data is going to the
 * wrong place.
 *
 * The sentence comes from the backend, worded for the caller's role, so the web
 * and the phone can never disagree about what it says.
 */
export default function SeasonAlignmentBanner() {
  const { data } = useSeasonAlignment();

  // No message means the open season covers today — nothing to say.
  if (!data?.message) return null;

  return (
    <div
      role="status"
      className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{data.message}</span>
    </div>
  );
}
