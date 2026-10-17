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
  remark: z.string().optional(),
});

// ── LPM entry: field / direct sowing ──
const lpmEntrySchema = z.object({
  variety: z.string().min(1, "Variety is required"),
  stockType: z.enum(["BIO", "CVT"], { message: "Stock type is required" }),
  lines: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().min(1, "Lines is required"),
  ),
  metersPerLine: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().min(0, "Must be at least 0"),
  ),
  // NO seed total: a field line is planned by its DENSITY, and the server works
  // the total out from the lines, the metres per line and the farm's own figure
  // (user, 2026-10-11). It used to be typed here.
  remark: z.string().optional(),
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

/**
 * One entry, on its own — for adding a line to a plan that already exists, and
 * for correcting one (SOW-08).
 *
 * The fields are the *same objects* the create form validates with, so a line
 * added later can never obey different rules from one created with the plan.
 * The only addition is `plannedDate`: the create form keeps a single date for the
 * whole plan, but a line added afterwards needs its own, and the backend DTO
 * requires one per entry.
 */
const plannedDateField = z.string().min(1, "Planned date is required");

export const addSsmPlanEntrySchema = ssmEntrySchema.extend({
  plannedDate: plannedDateField,
});

export const addLpmPlanEntrySchema = lpmEntrySchema.extend({
  plannedDate: plannedDateField,
});

/** The schema for a single entry, chosen by the plan's type. */
export function planEntrySchemaFor(planType: "SSM" | "LPM") {
  return planType === "SSM" ? addSsmPlanEntrySchema : addLpmPlanEntrySchema;
}

export type PlanEntryAddFormInput =
  | z.input<typeof addSsmPlanEntrySchema>
  | z.input<typeof addLpmPlanEntrySchema>;

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
