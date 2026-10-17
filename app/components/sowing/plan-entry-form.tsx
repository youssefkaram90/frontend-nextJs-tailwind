"use client";

import { useForm,useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import {
  PlanEntryFields,
  PlanEntryRemarkField,
} from "@/app/components/sowing/plan-entry-fields";
import { planEntrySchemaFor } from "@/app/schemas/sowing-plan.schema";
import { DEFAULT_SEEDS_PER_TRAY } from "@/app/schemas/sowing.schema";
import { useSettingValue } from "@/app/lib/hooks/use-settings";
import type {
  CreatePlanEntryDto,
  SowingPlanEntry,
} from "@/app/lib/types/sowing";
import { StockType } from "@/app/lib/types/delivery";

/**
 * Add a line to a plan that already exists, or correct one — the SAME fields the
 * create-plan form uses, with the same validation rules (SOW-08).
 *
 * Until now a line could only be created together with its plan, and then only
 * deleted, closed or reopened: a wrong variety, a wrong tray count or one line too
 * many meant rebuilding the whole plan. The backend route to correct a line has
 * existed (and been repaired) all along, with nothing calling it.
 *
 * `CreatePlanEntryDto` is a **replacement**, not a patch, so the form always sends
 * every field its plan type needs — which is exactly why reusing the create form's
 * fields is the only safe option.
 */
type FormValues = {
  plannedDate: string;
  variety: string;
  stockType: StockType;
  peat?: string;
  plannedTrays?: number | string;
  lines?: number | string;
  metersPerLine?: number | string;
  plannedQuantity?: number | string;
  remark?: string;
};

type Props = {
  planType: "SSM" | "LPM";
  /** Present when correcting; absent when adding a line. */
  entry?: SowingPlanEntry;
  /** Title hint, e.g. "Line 3". */
  position?: number;
  submitting?: boolean;
  onSubmit: (dto: CreatePlanEntryDto) => void;
  onCancel: () => void;
};

function toDto(
  values: FormValues,
  planType: "SSM" | "LPM",
  seedsPerTray: number,
): CreatePlanEntryDto {
  const common = {
    variety: values.variety,
    stockType: values.stockType,
    peat: values.peat || undefined,
    plannedDate: new Date(values.plannedDate),
    remark: values.remark || undefined,
  };

  if (planType === "SSM") {
    const trays = Number(values.plannedTrays);
    return {
      ...common,
      plannedTrays: trays,
      // The farm's figure, so a line's forecast matches what the sowing will
      // actually use (SOW-11, phase 3).
      plannedQuantity: trays > 0 ? Math.round(trays * seedsPerTray) : undefined,
    };
  }

  return {
    ...common,
    lines: Number(values.lines),
    metersPerLine: Number(values.metersPerLine),
    // No seed total: a field line is planned by its density, and the server works
    // the total out from the farm's own figure (user, 2026-10-11).
  };
}

export function PlanEntryForm({
  planType,
  entry,
  position,
  submitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(planEntrySchemaFor(planType)) as any,
    defaultValues: {
      plannedDate: entry
        ? entry.plannedDate.slice(0, 10)
        : new Date().toLocaleDateString("en-CA"),
      variety: entry?.variety ?? "",
      stockType: (entry?.stockType as StockType) ?? StockType.CVT,
      peat: entry?.peat ?? "",
      plannedTrays: entry?.plannedTrays ?? undefined,
      lines: entry?.lines ?? undefined,
      metersPerLine: entry?.metersPerLine ?? undefined,
      plannedQuantity: entry?.plannedQuantity ?? undefined,
      remark: entry?.remark ?? "",
    },
  });

  // The two live previews read the values as they are typed.
  const values = useWatch({control});

  const isSSM = planType === "SSM";

  // The farm's figure, so a line's forecast matches what the sowing will use.
  const seedsPerTraySetting = useSettingValue(
    "DEFAULT_SEEDS_PER_TRAY",
    DEFAULT_SEEDS_PER_TRAY,
  );

  return (
    <form
      onSubmit={handleSubmit((v) =>
        onSubmit(toDto(v, planType, seedsPerTraySetting)),
      )}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">
            Planned Date <span className="text-red-400 font-normal"> *</span>
          </label>
          <input
            type="date"
            {...register("plannedDate")}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.plannedDate && (
            <p className="mt-1 text-xs text-red-600">
              {errors.plannedDate.message}
            </p>
          )}
        </div>
      </div>

      <PlanEntryFields
        register={register}
        errors={errors}
        namePrefix=""
        values={values}
        isSSM={isSSM}
      />

      <PlanEntryRemarkField register={register} errors={errors} namePrefix="" />

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {entry ? `Save line ${position ?? ""}`.trim() : "Add line"}
        </button>
      </div>
    </form>
  );
}
