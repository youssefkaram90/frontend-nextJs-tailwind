import { z } from "zod";

export const DEFAULT_SEEDS_PER_TRAY = 285;

// ── SSM record: tunnel / tray-based ──
const ssmRecordSchema = z.object({
  planEntryId: z.string().optional(),
  variety: z.string().min(1, "Variety is required"),
  /**
   * Batch code (SSM) — prints on the batch as "Variety <code>".
   *
   * Required, with its own wording (SSM-08): the server made it required in
   * SSM-02, but the form still let it through empty, so the user got the API's
   * single generic sentence instead of being told which field was missing.
   * `Number("")` is 0 and `Number("abc")` is NaN, so both fail the same check
   * and are told the same thing.
   */
  code: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .refine(
        (n) => Number.isInteger(n) && n > 0,
        "Enter the batch code as a number, for example 12",
      ),
  ),
  lotNumber: z.string().min(1, "Lot number is required"),
  stockType: z.string().optional(),
  /**
   * The peat pool this record takes from.
   *
   * Nobody was asked until now: every peat lot went into ONE pool, so the server
   * deducted from it whatever the form said. Peat is tracked per lot (decided
   * 2026-10-05), so the operator picks — and the stock type is required with the
   * lot number, because that pair is the pool's identity.
   */
  peatLotNumber: z.string().min(1, "Peat lot is required"),
  peatStockType: z.enum(["BIO", "CVT"], {
    message: "Peat stock type is required",
  }),
  tunnelId: z.string().optional(),
  numberOfTrays: z.coerce.number().int().min(1, "Must be at least 1"),
  /**
   * Seeds per tray is NOT asked for on this form any more (decided 2026-10-07).
   *
   * The farm sets one figure on the settings page and the server records every new
   * sowing with it — a field here could only ever disagree with that, and a sowing
   * is not the moment to argue about it. The number stored on each row is still
   * what that sowing was recorded with, and the edit form can correct one row.
   */
  remarks: z.string().optional(),
});

// ── LPM record: field / direct sowing ──
const lpmRecordSchema = z.object({
  planEntryId: z.string().optional(),
  variety: z.string().min(1, "Variety is required"),
  lotNumber: z.string().min(1, "Lot number is required"),
  stockType: z.string().optional(),
  /**
   * REQUIRED (PSTOCK-20 (i), decided 2026-10-10) — the same rule the phone's
   * schema already had.
   *
   * A field sowing saved without a sector stored a blank location, which both
   * screens print as "Not assigned" — the same bucket as a tunnel batch whose
   * trays have not been transported. The server refuses it too, in a sentence
   * ("Choose the sector this field sowing goes into."); asking here means the
   * operator is told while the form is still open.
   */
  sectorId: z.string().min(1, "Sector is required"),
  quantityUsed: z.coerce.number().int().min(1, "Must be at least 1"),
  lines: z.coerce.number().min(1, "Must be at least 1"),
  metersPerLine: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().min(1, "Must be at least 1"),
  ),
  seedsPerMeter: z.number().optional(),
  remarks: z.string().optional(),
});

// ── Common fields shared by both sowing types ──
const sowingBaseFields = {
  planId: z.string().min(1, "Plan is required"),
  sowingDate: z.string().min(1, "Sowing date is required"),
};

// ── Full schemas per type ──
const ssmSowingSchema = z.object({
  ...sowingBaseFields,
  sowingType: z.literal("SSM"),
  records: z.array(ssmRecordSchema).min(1, "At least one record is required"),
});

const lpmSowingSchema = z.object({
  ...sowingBaseFields,
  sowingType: z.literal("LPM"),
  records: z.array(lpmRecordSchema).min(1, "At least one record is required"),
});

// ── Discriminated union — TypeScript narrows on sowingType ──
export const createSowingSchema = z.discriminatedUnion("sowingType", [
  ssmSowingSchema,
  lpmSowingSchema,
]);

// ── Edit schema (unchanged — mixed fields for edit form) ──
export const editSowingSchema = z.object({
  planId: z.string().min(1, "Plan is required"),
  variety: z.string().min(1, "Variety is required"),
  sowingDate: z.string().min(1, "Sowing date is required"),
  lotNumber: z.string().min(1, "Lot number is required"),
  stockType: z.enum(["BIO", "CVT"]),
  /**
   * The peat pool — SSM only.
   *
   * Optional here so the LPM form is untouched; the SSM branch of the edit form
   * requires it and refuses to submit without it, because "not sent" would mean
   * "keep the pool you already used" rather than "I meant to change it" (SOW-12).
   */
  peatLotNumber: z.string().optional(),
  peatStockType: z.enum(["BIO", "CVT"]).optional(),
  tunnelId: z.string().optional(),
  sectorId: z.string().optional(),
  numberOfTrays: z.coerce.number().int().min(1).optional(),
  /** Empty means "keep what the sowing already used" — see the create schema. */
  seedsPerTray: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.coerce.number().int().min(1).optional(),
  ),
  quantityUsed: z.coerce.number().int().min(0).default(0),
  lines: z.coerce.number().int().min(0).default(0),
  meterPerLine: z.coerce.number().int().min(0).default(0),
  remarks: z.string().optional(),
});

export type CreateSowingFormData = z.input<typeof createSowingSchema>;
export type EditSowingFormData = z.input<typeof editSowingSchema>;

// ── Combined form types (all fields for react-hook-form) ──
export type SowingRecordFormInput = z.input<typeof ssmRecordSchema> &
  z.input<typeof lpmRecordSchema>;

export type SowingCreateFormInput = {
  planId: string;
  sowingType: "SSM" | "LPM";
  sowingDate: string;
  records: SowingRecordFormInput[];
};
