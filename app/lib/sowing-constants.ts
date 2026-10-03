/**
 * Physical layout constants for sowing.
 *
 * These MIRROR the backend definition in
 * `Backend/src/common/sowing.constants.ts` and exist only so the UI can show a
 * live preview before saving. The value that is actually stored always comes
 * from the backend — nothing here is ever sent as the source of truth.
 */
export const ROWS_PER_LINE = 7;

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
