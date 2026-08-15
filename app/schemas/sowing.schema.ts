import { z } from "zod";

export const DEFAULT_SEEDS_PER_TRAY = 285;

// ── SSM record: tunnel / tray-based ──
const ssmRecordSchema = z.object({
  planEntryId: z.string().optional(),
  variety: z.string().min(1, "Variety is required"),
  lotNumber: z.string().min(1, "Lot number is required"),
  stockType: z.string().optional(),
  tunnelId: z.string().optional(),
  numberOfTrays: z.coerce.number().int().min(1, "Must be at least 1"),
  seedsPerTray: z.coerce.number().int().min(1).default(DEFAULT_SEEDS_PER_TRAY),
});

// ── LPM record: field / direct sowing ──
const lpmRecordSchema = z.object({
  planEntryId: z.string().optional(),
  variety: z.string().min(1, "Variety is required"),
  lotNumber: z.string().min(1, "Lot number is required"),
  stockType: z.string().optional(),
  sectorId: z.string().optional(),
  quantityUsed: z.coerce.number().int().min(1, "Must be at least 1"),
  lines: z.string().min(1, "Lines is required"),
  metersPerLine: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().min(0, "Must be at least 0"),
  ),
  seedsPerMeter: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().min(1, "Must be at least 1"),
  ),
});

// ── Common fields shared by both sowing types ──
const sowingBaseFields = {
  planId: z.string().min(1, "Plan is required"),
  sowingDate: z.string().min(1, "Sowing date is required"),
  remarks: z.string().optional(),
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
  numberOfTrays: z.coerce.number().int().min(0).optional(),
  seedsPerTray: z.coerce.number().int().min(1).default(DEFAULT_SEEDS_PER_TRAY),
  quantityUsed: z.coerce.number().int().min(0).default(0),
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
  remarks?: string;
  records: SowingRecordFormInput[];
};
