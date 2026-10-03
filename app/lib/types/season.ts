/** One farming season: "26-27" = 1 Jul 2026 → 30 Jun 2027. */
export type Season = {
  id: string;
  code: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "CLOSED";
  activatedAt: string | null;
  closedAt: string | null;
  createdBy: string | null;
};

/** A season named by id and code — enough to label a screen. */
export type SeasonRef = Pick<Season, "id" | "code">;

/**
 * What `GET /seasons/active` returns: the open season, or null when none is open.
 *
 * `viewing` names the season an administrator is browsing INSTEAD of the open
 * one — null for everybody else, and for an administrator looking at the open
 * season itself. Anything that names a season to the user has to prefer it, or
 * it will name a different season from the one the table is showing (SEASON-06).
 */
export type ActiveSeason = SeasonRef & { viewing?: SeasonRef | null };

/** One finding in a close report: a sentence plus the lines behind it. */
export type CloseFinding = {
  message: string;
  details: string[];
};

/** What `GET /seasons/:id/close-preview` returns. */
export type ClosePreview = {
  season: { id: string; code: string };
  /** While this is non-empty the close is refused. */
  blocks: CloseFinding[];
  /** Shown to be acknowledged; the close may still go ahead. */
  warnings: CloseFinding[];
  /** Read-only context, e.g. the closing stock balances. */
  info: CloseFinding[];
  canClose: boolean;
};
