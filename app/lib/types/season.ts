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
  /** The creator's name as it was at the time — the readable half of `createdBy`. */
  createdByName: string | null;
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
  /**
   * The season that follows this one. `id` is null while it does not exist yet
   * — closing creates it, so it is always safe to offer as a choice.
   */
  nextSeason: { id: string | null; code: string };
  /** While this is non-empty the close is refused. */
  blocks: CloseFinding[];
  /** Shown to be acknowledged; the close may still go ahead. */
  warnings: CloseFinding[];
  /** Read-only context, e.g. the closing stock balances. */
  info: CloseFinding[];
  canClose: boolean;
};

/** Which season to open when a season is closed. */
export type SeasonToOpen = "next" | string | null;

/** What `POST /seasons/:id/close` returns. */
export type CloseResult = {
  closed: SeasonRef;
  /** The season this close opened; null when no season was opened. */
  opened: SeasonRef | null;
};

/** How the open season lines up with today's date. */
export type SeasonAlignmentState =
  | "ALIGNED"
  | "OPEN_AHEAD"
  | "OPEN_BEHIND"
  | "NONE";

/**
 * What `GET /seasons/alignment` returns — a sentence for a banner, never a rule.
 * `message` is null while the open season covers today.
 */
export type SeasonAlignment = {
  state: SeasonAlignmentState;
  /** The code of the season whose dates contain today, when there is one. */
  coversToday: string | null;
  message: string | null;
};
