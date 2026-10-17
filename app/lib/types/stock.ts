export interface StockItem {
  id: string;
  productType: string;
  stockType: string;
  lotNumber: string;
  productName: string;
  supplierName: string;
  currentQuantity: number;
  createdAt: string;
  updatedAt: string;
  movements?: StockMovement[];
  /** The season the lot belongs to. Only sent by the detail endpoint. */
  season?: { code: string } | null;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  quantity: number;
  referenceType: string;
  referenceId: string | null;
  /** Only set on `manual` movements — WHY the person moved the stock. */
  reason: string | null;
  /** Free text the person typed alongside the reason. */
  note: string | null;
  /**
   * WHO moved it — the user's **name**, never null. Sent on every
   * movement, so the ledger reads on screen without looking anything up.
   */
  createdByName: string;
  createdAt: string;
}

export interface StockSummary {
  [productType: string]: {
    totalQuantity: number;
    lots: number;
  };
}

/**
 * The four reasons a person can record a stock movement by hand.
 *
 * `direction` says which way each reason may move the pool, so the stock page
 * can only offer valid combinations. The server validates them again — this is
 * UX, not the rule.
 */
/**
 * Every reason a person may record by hand, and which way each one is allowed to
 * move the pool. The server validates the same sign rules again — this is UX.
 *
 * `used` is deliberately absent: consumption is written by the server when a
 * treatment is logged (P6-06), never picked by a person.
 */
const HAND_REASONS = [
  { value: "opening", label: "Opening balance", direction: "add" },
  { value: "received", label: "Received", direction: "add" },
  {
    value: "returned_to_client",
    label: "Returned to client",
    direction: "remove",
  },
  { value: "waste", label: "Waste", direction: "remove" },
  { value: "correction", label: "Correction", direction: "both" },
] as const;

/**
 * Seeds and peat. **`received` is not here**: they only ever arrive on a
 * delivery, which records itself in `referenceType`, so the label would just
 * restate it.
 */
export const MOVEMENT_REASONS = HAND_REASONS.filter(
  (reason) => reason.value !== "received",
);

/**
 * Agri-inputs: the same list **plus `received`**, because a chemical can
 * be delivered without a delivery record. One list, one set of labels — the
 * agri-input screen cannot end up calling "waste" something else.
 */
export const AGRI_INPUT_REASONS = HAND_REASONS;

/** The label for a stored reason, whoever recorded it. */
export function movementReasonLabel(reason: string | null): string {
  const match = HAND_REASONS.find((r) => r.value === reason);
  return match ? match.label : "—";
}

/**
 * Every way a movement can arise, in words.
 *
 * These were printed raw on the stock screen — `manual`, `delivery`, `sowing` —
 * which is a database value shown to a farmer. The words match the reason labels
 * above: the ledger should read like a sentence, and the screen is the only
 * place its reader ever sees it.
 */
const MOVEMENT_TYPES = [
  { value: "delivery", label: "Delivery" },
  { value: "sowing", label: "Sowing" },
  { value: "manual", label: "Recorded by hand" },
] as const;

export function movementTypeLabel(referenceType: string | null): string {
  const match = MOVEMENT_TYPES.find((t) => t.value === referenceType);
  return match ? match.label : "—";
}

export type MovementReason = (typeof HAND_REASONS)[number]["value"];

export type AdjustStockInput = {
  /** Signed: positive adds, negative removes. The form computes the sign. */
  stockItemId: string;
  quantity: number;
  reason: MovementReason;
  note?: string;
};
