/**
 * Physical layout constants for sowing.
 *
 * These MIRROR the backend definition in
 * `Backend/src/common/sowing.constants.ts` and exist only so the UI can show a
 * live preview before saving. The value that is actually stored always comes
 * from the backend — nothing here is ever sent as the source of truth.
 */
export const ROWS_PER_LINE = 7;

/**
 * Trays one big ball of peat fills.
 *
 * Also a setting the farm can change (SOW-11); read it with `useSettingValue` and
 * keep this only as the fallback for the moment before the answer arrives.
 */
export const TRAYS_PER_PEAT_BALL = 380;

/**
 * The bucket a batch sits in while its trays have not been transported — and the
 * name the plant-stock screens show for it.
 *
 * It mirrors `UNASSIGNED_LOCATION` in the backend's `common/sowing.constants.ts`,
 * which is what the server writes; the screens also fall back to it for a row
 * whose location is blank (an old field sowing saved with no sector).
 *
 * It is a VALUE, not a label: it is compared with `===` and used as a URL
 * segment, so it has to match the backend exactly.
 */
export const NOT_ASSIGNED_LOCATION = "Not assigned";

/** Row-metres covered by a sowing: every row of every line. */
export function toRowMetres(lines: number, metresPerLine: number): number {
  return lines * metresPerLine * ROWS_PER_LINE;
}

/**
 * Seeds per ROW-metre — the same figure the backend stores on the sowing.
 * Use only for displaying a preview while the form is being filled in.
 */
export function seedsPerRowMetre(
  seeds: number,
  lines: number,
  metresPerLine: number,
): number {
  const rowMetres = toRowMetres(lines, metresPerLine);
  return rowMetres > 0 ? Math.round(seeds / rowMetres) : 0;
}

/**
 * The density a field (LPM) line is PLANNED at, in seeds per row-metre.
 *
 * Also a setting the farm can change (SOW-11); read it with `useSettingValue` and
 * keep this only as the fallback for the moment before the answer arrives. It is
 * the same for every variety, and it is for PLANNING only — what a sowing actually
 * used is recorded when it is executed.
 */
export const DEFAULT_SEEDS_PER_ROW_METRE = 120;

/**
 * The seeds a field line needs at that density — what the planning form previews.
 *
 *   seeds = lines x metresPerLine x ROWS_PER_LINE x seeds per row-metre
 *
 * The backend works the stored figure out the same way, from the same setting; this
 * only shows it while the form is being filled in.
 */
export function plannedSeedsFromRate(
  seedsPerRowMetreValue: number,
  lines: number,
  metresPerLine: number,
): number {
  return Math.round(toRowMetres(lines, metresPerLine) * seedsPerRowMetreValue);
}
