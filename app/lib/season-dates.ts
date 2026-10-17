/**
 * Season dates, worded the way the server words them.
 *
 * A season's boundaries are stored and rendered in **UTC** on purpose (see
 * `Backend/src/common/season-code.ts`): `1 Jul 2026 00:00:00.000Z` →
 * `30 Jun 2027 23:59:59.999Z`. A client must therefore NOT convert them to the
 * browser's timezone — a viewer behind UTC would see the previous day, and the
 * web would describe a different period from the server. `en-GB` matches the
 * server's wording, so the two never disagree.
 *
 * One place, so every screen that shows a season date says it the same way.
 */

const SEASON_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
};

/** Any season boundary → "1 Jul 2026", always in UTC. */
export function formatSeasonDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-GB", SEASON_DATE_FORMAT);
}

/** The period a season covers → "1 Jul 2026 → 30 Jun 2027". */
export function formatSeasonRange(season: {
  startDate: string | Date;
  endDate: string | Date;
}): string {
  return `${formatSeasonDate(season.startDate)} → ${formatSeasonDate(season.endDate)}`;
}
