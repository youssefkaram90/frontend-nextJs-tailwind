/**
 * The catalogue fields the agri-input screens show.
 *
 * A copy of the shape the backend sends (it selects these fields on purpose):
 * `currentQuantity` is absent because that column on the catalogue is superseded
 * — a season's stock lives on the season row.
 */
export interface AgriInputProduct {
  id: string;
  name: string;
  activeIngredient: string | null;
  category: string | null;
  unit: string | null;
  notes: string | null;
}

/**
 * One product for one season.
 *
 * This single row answers both questions: its **existence** means the product is
 * allowed this season, and `currentQuantity` is that season's stock.
 */
export interface AgriInputSeasonRow {
  id: string;
  seasonId: string;
  productId: string;
  currentQuantity: number;
  product: AgriInputProduct;
  /** Only the detail endpoint sends this. */
  season?: { code: string } | null;
  createdAt: string;
  updatedAt: string;
}

/** The ledger behind that stock. */
export interface AgriInputMovement {
  id: string;
  inputSeasonId: string;
  /** Positive is in, negative is out — the same convention as seed stock. */
  quantity: number;
  reason: string;
  referenceType: string | null;
  referenceId: string | null;
  note: string | null;
  /** The user's **name**, never null. */
  createdByName: string;
  createdAt: string;
}

export interface AddAgriInputInput {
  /** The catalogue product — the season row is created from it. */
  productId: string;
  openingQuantity?: number;
  note?: string;
}

export interface AdjustAgriInputInput {
  /** Signed: positive adds, negative removes. The add/remove toggle sets it. */
  quantity: number;
  reason: string;
  note?: string;
}

/**
 * The categories a product can be filed under (crop protection **and**
 * fertilisers share one catalogue, which is why FERTILISER sits alongside the
 * chemicals rather than in a table of its own).
 */
export const AGRI_INPUT_CATEGORIES = [
  "FUNGICIDE",
  "INSECTICIDE",
  "HERBICIDE",
  "FERTILISER",
  "OTHER",
] as const;

/** The category badge colours, in the app's semantic palette. */
export function categoryBadgeClass(category: string | null): string {
  switch (category) {
    case "FUNGICIDE":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
    case "INSECTICIDE":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    case "HERBICIDE":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "FERTILISER":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  }
}
