"use client";

import type { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";
import {
  DEFAULT_SEEDS_PER_ROW_METRE,
  ROWS_PER_LINE,
  plannedSeedsFromRate,
} from "@/app/lib/sowing-constants";
import { DEFAULT_SEEDS_PER_TRAY } from "@/app/schemas/sowing.schema";
import { useSettingValue } from "@/app/lib/hooks/use-settings";

/**
 * The editor for ONE planned line, shared by every screen that edits one.
 *
 * It was written inline inside `(app)/sowing/plans/create/page.tsx`, twice over
 * in effect: the same fields had to be reproduced for "add a line" and "correct a
 * line", with no way of telling whether the three copies still agreed. The rules
 * themselves already live in `schemas/sowing-plan.schema.ts`; this is the fields
 * that go with them (SOW-08).
 *
 * Used with two different shapes of form, which is why the field paths are built
 * from a prefix:
 *
 * - the create form, one row of an array — `namePrefix="entries.0."`
 * - the single-entry form, standalone — `namePrefix=""`
 */
type FieldErrorLike = { message?: string };

/** `FieldErrors<T>` cannot be indexed by a name TypeScript knows nothing about. */
type LooseErrors = Record<string, FieldErrorLike | undefined>;

export type PlanEntryValues = Partial<{
  plannedTrays: unknown;
  plannedQuantity: unknown;
  lines: unknown;
  metersPerLine: unknown;
}>;

const INPUT =
  "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

type Props<T extends FieldValues> = {
  register: UseFormRegister<T>;
  /**
   * The errors for THIS line.
   *
   * Typed loosely on purpose: the same component serves a row of an array form
   * (`errors.entries?.[i]`) and a standalone single-entry form (`errors`), and the
   * two have unrelated types. Only `.message` is ever read, through a cast.
   */
  errors?: unknown;
  /** e.g. `entries.2.` — empty for a standalone single-entry form. */
  namePrefix: string;
  /** This line's current values, for the two live previews below. */
  values?: PlanEntryValues;
  /** SSM asks for trays and peat; LPM asks for lines, metres and seeds. */
  isSSM: boolean;
};

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function PlanEntryFields<T extends FieldValues>({
  register,
  errors,
  namePrefix,
  values,
  isSSM,
}: Props<T>) {
  // The farm's figure, unless the server cannot be reached (SOW-11, phase 3).
  const seedsPerTray = useSettingValue(
    "DEFAULT_SEEDS_PER_TRAY",
    DEFAULT_SEEDS_PER_TRAY,
  );
  // The density field lines are planned at — also the farm's own figure, and the
  // same for every variety (user, 2026-10-11).
  const planningRate = useSettingValue(
    "DEFAULT_SEEDS_PER_ROW_METRE",
    DEFAULT_SEEDS_PER_ROW_METRE,
  );
  const field = (name: string) => `${namePrefix}${name}` as FieldPath<T>;
  const err = (name: string): string | undefined =>
    (errors as LooseErrors | undefined)?.[name]?.message;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        {/** Variety */}
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">
            Variety <span className="text-red-400 font-normal"> *</span>
          </label>
          <input
            type="text"
            {...register(field("variety"))}
            className={INPUT}
            placeholder="Variety name"
          />
          {err("variety") && (
            <p className="mt-1 text-xs text-red-600">{err("variety")}</p>
          )}
        </div>

        {/** Stock Type */}
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">
            Stock Type <span className="text-red-400 font-normal"> *</span>
          </label>
          <select {...register(field("stockType"))} className={INPUT}>
            <option value="BIO">BIO</option>
            <option value="CVT">CVT</option>
          </select>
        </div>
      </div>

      {/* SSM-specific */}
      {isSSM && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/** Planned trays */}
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">
                Planned Trays{" "}
                <span className="text-red-400 font-normal"> *</span>
              </label>
              <input
                type="number"
                min="1"
                {...register(field("plannedTrays"))}
                className={INPUT}
                placeholder="e.g. 1 000"
              />
              {err("plannedTrays") && (
                <p className="mt-1 text-xs text-red-600">
                  {err("plannedTrays")}
                </p>
              )}
            </div>

            {/** Peat used */}
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">
                Peat <span className="text-red-400 font-normal"> *</span>
              </label>
              <input
                type="text"
                {...register(field("peat"))}
                className={INPUT}
                placeholder='e.g. "50% CVT 50% BIO"'
              />
            </div>
          </div>

          {/* Seeds total (SSM: trays × seeds per tray) */}
          {(() => {
            const trays = toNumber(values?.plannedTrays);
            const total = trays * seedsPerTray;
            return (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2">
                <span className="text-xs text-green-600 dark:text-green-400">
                  Seeds Total {`Trays(${trays}) * ${seedsPerTray}`}
                </span>
                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                  {total > 0 ? total.toLocaleString("fr-FR") : "0"}
                </p>
              </div>
            );
          })()}
        </>
      )}

      {/* LPM-specific */}
      {!isSSM && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/** Lines */}
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">
                Lines <span className="text-red-400 font-normal"> *</span>
              </label>
              <input
                type="text"
                {...register(field("lines"))}
                className={INPUT}
                placeholder="e.g. 2 or 2.5"
              />
              {err("lines") && (
                <p className="mt-1 text-xs text-red-600">{err("lines")}</p>
              )}
            </div>

            {/** Metres per line */}
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">
                Meters/Line <span className="text-red-400 font-normal"> *</span>
              </label>
              <input
                type="number"
                {...register(field("metersPerLine"))}
                className={INPUT}
                placeholder="e.g. 120"
              />
              {err("metersPerLine") && (
                <p className="mt-1 text-xs text-red-600">
                  {err("metersPerLine")}
                </p>
              )}
            </div>
          </div>

          {/*
            Seeds for the line — WORKED OUT, not typed (user, 2026-10-11).

            The planner knows the lines, the length and the density the farm sows
            at; asking for the seed total made them do the multiplication in their
            head, and a mistyped total changed the plan's forecast. The server works
            it out the same way from the same setting — this is the preview.
          */}
          {(() => {
            const lines = toNumber(values?.lines);
            const metresPerLine = toNumber(values?.metersPerLine);
            const total = plannedSeedsFromRate(
              planningRate,
              lines,
              metresPerLine,
            );
            return (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2">
                <span className="text-xs text-green-600 dark:text-green-400">
                  Seeds needed (auto) — {lines} × {metresPerLine} m ×{" "}
                  {ROWS_PER_LINE} rows × {planningRate} seeds/m
                </span>
                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                  {total > 0 ? total.toLocaleString("fr-FR") : "0"}
                </p>
                <p className="mt-0.5 text-[11px] text-green-700/70 dark:text-green-400/70">
                  A plan is a forecast: the seed a sowing really uses is
                  recorded when it is executed.
                </p>
              </div>
            );
          })()}
        </>
      )}
    </>
  );
}

/**
 * The remark of one planned line.
 *
 * Split out on its own because the create form keeps it OUTSIDE the collapsible
 * part of a row: opening and closing a row must not hide a note somebody has
 * already typed.
 */
export function PlanEntryRemarkField<T extends FieldValues>({
  register,
  errors,
  namePrefix,
}: Pick<Props<T>, "register" | "errors" | "namePrefix">) {
  const field = (name: string) => `${namePrefix}${name}` as FieldPath<T>;
  const err = (name: string): string | undefined =>
    (errors as LooseErrors | undefined)?.[name]?.message;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
      <div>
        <label className="block text-xs text-gray-500 mb-0.5">
          Remark <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          {...register(field("remark"))}
          className={INPUT}
          placeholder="Mark your notes"
        />
        {err("remark") && (
          <p className="mt-1 text-xs text-red-600">{err("remark")}</p>
        )}
      </div>
    </div>
  );
}
