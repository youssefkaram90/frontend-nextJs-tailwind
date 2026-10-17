/**
 * How a stock quantity is written on screen.
 *
 * ONE place, because this rule used to be written out **19 times** across the
 * three apps — as inline `x.toFixed(2)`, as `productType === "PEAT" ? … : …`,
 * and as three private helpers with three different signatures (two on the web,
 * one on the phone). Changing it meant finding all of them, and one of them was
 * in the backend's close-season report.
 *
 * **The rule:** seeds and everything else are COUNTS, so they read `12,500`.
 * Peat is a bulk figure, so it reads `125.50` — fixed decimals, never rounded
 * away.
 *
 * The locale is pinned to `en-GB` deliberately: without it the separator depends
 * on the device's own setting, so the same quantity could read `12.500` on one
 * phone and `12,500` on the next. The backend already wrote `en-GB`; now all
 * three agree.
 *
 * The product type is passed rather than a boolean so the CALLER stops deciding
 * what counts as peat — every one of those call sites was answering that
 * question itself.
 */

/** Peat is a bulk quantity: this many decimals, fixed. */
export const PEAT_DECIMALS = 2;

export function formatQuantity(value: number, productType: string): string {
  return productType === "PEAT"
    ? value.toFixed(PEAT_DECIMALS)
    : value.toLocaleString("en-GB");
}
