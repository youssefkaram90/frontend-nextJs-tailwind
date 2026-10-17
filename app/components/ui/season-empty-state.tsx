"use client";

import { useActiveSeason } from "@/app/lib/hooks/use-seasons";

/**
 * An empty-state line that names the season the screen is SHOWING.
 *
 * A brand-new season looks exactly like an empty database, so the sentence has
 * to say which one it is: the list is empty **in 27-28**, and last season's rows
 * are not lost — they belong to a season that is closed.
 *
 * Showing is the open season for everybody, EXCEPT an administrator browsing
 * another one through the header switcher: the table follows that choice, so
 * this sentence has to follow it too. Naming the open season instead is how it
 * used to say "empty in 26-27" while the list was showing 25-26 (SEASON-06).
 *
 * One place, so every list says it the same way.
 */
export function SeasonEmptyState({
  /** Plural noun, e.g. "tunnels". */
  what,
  /** What to do about it, e.g. "Add your tunnels to start." */
  action,
}: {
  what: string;
  action: string;
}) {
  const { data: season, isPending } = useActiveSeason();

  if (isPending) {
    return (
      <span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span>
    );
  }

  if (!season) {
    return (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        No season is open yet, so there is nothing to show. Ask an administrator
        to open the season.
      </span>
    );
  }

  // The season being shown: the open one, unless an administrator is browsing
  // another through the header switcher (SEASON-06).
  const shown = season.viewing ?? season;

  return (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      No {what} yet in <strong>{shown.code}</strong>. {action}
    </span>
  );
}
