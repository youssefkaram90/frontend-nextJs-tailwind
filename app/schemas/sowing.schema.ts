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
  tunnelId: z.string().optional(),
  numberOfTrays: z.coerce.number().int().min(1, "Must be at least 1"),
  seedsPerTray: z.coerce.number().int().min(1).default(DEFAULT_SEEDS_PER_TRAY),
  remarks: z.string().optional(),
});

// ── LPM record: field / direct sowing ──
const lpmRecordSchema = z.object({
  planEntryId: z.string().optional(),
  variety: z.string().min(1, "Variety is required"),
  lotNumber: z.string().min(1, "Lot number is required"),
  stockType: z.string().optional(),
  sectorId: z.string().optional(),
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
  tunnelId: z.string().optional(),
  sectorId: z.string().optional(),
  numberOfTrays: z.coerce.number().int().min(1).optional(),
  seedsPerTray: z.coerce.number().int().min(1).default(DEFAULT_SEEDS_PER_TRAY),
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
