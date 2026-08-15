import { z } from "zod";

// ── Common fields shared by both plan types ──
const planBaseFields = {
  planName: z.string().min(1, "Plan name is required"),
  location: z.string().optional(),
  sectorId: z.string().optional(),
  plannedDate: z.string().min(1, "Planned date is required"),
};

// ── SSM entry: tunnel / tray-based ──
const ssmEntrySchema = z.object({
  variety: z.string().min(1, "Variety is required"),
  stockType: z.enum(["BIO", "CVT"], { message: "Stock type is required" }),
  peat: z.string().optional(),
  plannedTrays: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().min(1, "Must be at least 1"),
  ),
  plannedQuantity: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().min(1).optional(),
  ),
});

// ── LPM entry: field / direct sowing ──
const lpmEntrySchema = z.object({
  variety: z.string().min(1, "Variety is required"),
  stockType: z.enum(["BIO", "CVT"], { message: "Stock type is required" }),
  lines: z.string().min(1, "Lines is required"),
  metersPerLine: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().min(0, "Must be at least 0"),
  ),
  seedsPerMeter: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().min(1, "Must be at least 1"),
  ),
  plannedQuantity: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().min(1).optional(),
  ),
});

// ── Full plan schemas per type ──
const ssmPlanSchema = z.object({
  ...planBaseFields,
  planType: z.literal("SSM"),
  entries: z.array(ssmEntrySchema).min(1, "At least one entry is required"),
});

const lpmPlanSchema = z.object({
  ...planBaseFields,
  planType: z.literal("LPM"),
  entries: z.array(lpmEntrySchema).min(1, "At least one entry is required"),
});

// ── Discriminated union: TypeScript narrows on planType ──
export const createSowingPlanSchema = z.discriminatedUnion("planType", [
  ssmPlanSchema,
  lpmPlanSchema,
]);

// ── Excel import (unchanged) ──
export const excelImportSchema = z.object({
  planType: z.enum(["SSM", "LPM"], { message: "Plan type is required" }),
  name: z.string().min(1, "Plan name is required"),
  excelBase64: z.string().min(1, "Excel file is required"),
});

// ── Inferred types ──
export type PlanEntryFormData =
  | z.input<typeof ssmEntrySchema>
  | z.input<typeof lpmEntrySchema>;

export type CreateSowingPlanFormData = z.input<typeof createSowingPlanSchema>;

// ── Combined form type (all fields for react-hook-form) ──
export type PlanEntryFormInput = z.input<typeof ssmEntrySchema> &
  z.input<typeof lpmEntrySchema>;

export type PlanCreateFormInput = {
  planName: string;
  planType: "SSM" | "LPM";
  location?: string;
  sectorId?: string;
  plannedDate: string;
  entries: PlanEntryFormInput[];
};
