"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  useTunnels,
  useSectors,
  useStockItemsForSowing,
  useSowingSSM,
  useSowingLPM,
  useUpdateSowingSSM,
  useUpdateSowingLPM,
} from "@/app/lib/hooks/use-sowing";
import type { StockItem } from "@/app/lib/types/stock";
import type {
  SowingSSM,
  SowingLPM,
  Tunnel,
  Sector,
} from "@/app/lib/types/sowing";
import { ArrowLeft, Info } from "lucide-react";
import {
  editSowingSchema,
  type EditSowingFormData,
  DEFAULT_SEEDS_PER_TRAY,
} from "@/app/schemas/sowing.schema";
import { seedsPerRowMetre } from "@/app/lib/sowing-constants";
import { collectValidationProblems } from "@/app/lib/validation-problems";
import { useSettingValue } from "@/app/lib/hooks/use-settings";

/**
 * Correct a sowing that was already recorded — `?type=SSM` or `?type=LPM` decides
 * which half of the form is shown.
 */
export default function EditSowingPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "SSM";
  const router = useRouter();
  const isSSM = type === "SSM";
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [validationProblems, setValidationProblems] = useState<string[]>([]);
  const { data: tunnelData } = useTunnels();
  const tunnels = (tunnelData ?? []) as Tunnel[];
  const { data: sectorData } = useSectors();
  const sectors = (sectorData ?? []) as Sector[];
  /**
   * The season's peat lots, for the picker (SOW-12). Peat is tracked per lot, so
   * the operator has to name the pool explicitly rather than a single "PEAT" row.
   */
  const { data: stockData } = useStockItemsForSowing();
  const peatItems = useMemo(
    () =>
      ((stockData ?? []) as StockItem[]).filter(
        (item) => item.productType === "PEAT",
      ),
    [stockData],
  );
  const ssmQuery = useSowingSSM(isSSM ? id : "");
  const lpmQuery = useSowingLPM(!isSSM ? id : "");
  const sowingQuery = isSSM ? ssmQuery : lpmQuery;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditSowingFormData>({
    resolver: zodResolver(editSowingSchema),
    defaultValues: {
      planId: "",
      variety: "",
      sowingDate: "",
      lotNumber: "",
      stockType: "BIO",
      tunnelId: "",
      sectorId: "",
      numberOfTrays: 0,
      seedsPerTray: DEFAULT_SEEDS_PER_TRAY,
      quantityUsed: 0,
      lines: 0,
      meterPerLine: 0,
      remarks: "",
    },
  });

  /**
   * The figure the farm uses now (SOW-11, phase 3). Shown as a hint, never sent
   * unless the operator types one — an omitted figure keeps what this sowing
   * already used.
   */
  const seedsPerTraySetting = useSettingValue(
    "DEFAULT_SEEDS_PER_TRAY",
    DEFAULT_SEEDS_PER_TRAY,
  );

  /**
   * Saving goes through the hooks, not the service functions (SOW-09).
   *
   * The hooks are what invalidate the cache — the sowing list, the plans and the
   * stock figures are held for 30 s to 2 minutes — so a save that skips them shows
   * the operator the numbers from before their change.
   */
  const updateSSM = useUpdateSowingSSM();
  const updateLPM = useUpdateSowingLPM();

  const numberOfTrays = useWatch({ control, name: "numberOfTrays" }) as
    | number
    | undefined;
  const seedsPerTray = useWatch({ control, name: "seedsPerTray" }) as
    | number
    | undefined;
  const calculatedTotal =
    isSSM && numberOfTrays && seedsPerTray
      ? Number(numberOfTrays) * (Number(seedsPerTray) || seedsPerTraySetting)
      : null;

  const nLines = useWatch({ control, name: "lines" }) as number | undefined;
  const metersPerLine = useWatch({ control, name: "meterPerLine" }) as
    | number
    | undefined;
  const LPMSeeds = useWatch({ control, name: "quantityUsed" }) as
    | number
    | undefined;
  const computedSeedsPerMeter = seedsPerRowMetre(
    Number(LPMSeeds),
    Number(nLines),
    Number(metersPerLine),
  );
  const calculatedSeedsPerMeter =
    !isSSM && computedSeedsPerMeter > 0 ? computedSeedsPerMeter : null;

  useEffect(() => {
    const sowing = sowingQuery.data;
    if (!sowing) return;
    reset({
      planId: sowing.planId ?? "",
      variety: sowing.variety,
      sowingDate: sowing.sowingDate
        ? new Date(sowing.sowingDate).toISOString().split("T")[0]
        : "",
      lotNumber: sowing.lotNumber,
      stockType: sowing.stockType as "BIO" | "CVT",
      remarks: sowing.remarks ?? "",
      numberOfTrays: isSSM ? (sowing as SowingSSM).numberOfTrays : undefined,
      seedsPerTray: isSSM
        ? (sowing as SowingSSM).seedsPerTray
        : DEFAULT_SEEDS_PER_TRAY,
      quantityUsed: !isSSM ? sowing.quantityUsed : 0,
      lines: !isSSM ? ((sowing as SowingLPM).lines ?? 0) : 0,
      meterPerLine: !isSSM ? (sowing as SowingLPM).meterPerLine : 0,
      /**
       * The peat pool this sowing used (SOW-12). Prefilled, so saving without
       * touching it keeps the same pool.
       */
      peatLotNumber: isSSM ? ((sowing as SowingSSM).peatLotNumber ?? "") : "",
      peatStockType: isSSM
        ? (((sowing as SowingSSM).peatStockType as "BIO" | "CVT") ?? "CVT")
        : "CVT",
      tunnelId: isSSM ? (sowing as SowingSSM).tunnelId : "",
      sectorId: !isSSM ? (sowing as SowingLPM).sectorId : "",
    });
  }, [sowingQuery.data, reset, isSSM]);

  /**
   * A refused submit has to say so (X-03). "Save Changes" did nothing at all
   * whenever a field the rules reject was left empty — no message, no request.
   */
  const onInvalid = (formErrors: unknown) => {
    setValidationProblems(collectValidationProblems(formErrors));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function onSubmit(data: EditSowingFormData) {
    setSubmitting(true);
    setServerError(null);
    setValidationProblems([]);
    try {
      if (isSSM) {
        // The pool is required for SSM: "not sent" would silently mean "keep the
        // old one", which is the opposite of what an edit form is for (SOW-12).
        if (!data.peatLotNumber) {
          setServerError("Choose the peat lot this sowing took from.");
          setSubmitting(false);
          return;
        }

        // Moving the pool moves stock in both directions — say so, and let the
        // operator back out (SOW-12).
        const previous = sowingQuery.data as SowingSSM | undefined;
        const poolChanged =
          previous &&
          (previous.peatLotNumber !== data.peatLotNumber ||
            previous.peatStockType !== data.peatStockType);
        if (
          poolChanged &&
          !window.confirm(
            `Move this sowing to peat lot ${data.peatLotNumber}` +
              (data.peatStockType ? ` (${data.peatStockType})` : "") +
              `?\n\nThe peat it used (${previous?.peatLotNumber}, ${previous?.peatStockType}) goes back to its own stock, and the new lot is deducted.`,
          )
        ) {
          setSubmitting(false);
          return;
        }

        await updateSSM.mutateAsync({
          id,
          planId: data.planId,
          planEntryId: undefined,
          // `null` clears the tunnel; an omitted field would mean "keep" (SSM-08).
          tunnelId: data.tunnelId || null,
          variety: data.variety,
          lotNumber: data.lotNumber,
          peatLotNumber: data.peatLotNumber,
          peatStockType: data.peatStockType,
          numberOfTrays: Number(data.numberOfTrays ?? 0),
          // Omitted when the field is empty: the server then keeps the figure this
          // sowing already used, rather than the form inventing one (SOW-11).
          ...(data.seedsPerTray
            ? { seedsPerTray: Number(data.seedsPerTray) }
            : {}),
          sowingDate: new Date(data.sowingDate),
          remarks: data.remarks,
        });
      } else {
        await updateLPM.mutateAsync({
          id,
          planId: data.planId,
          planEntryId: undefined,
          // `null` clears the sector; an omitted field would mean "keep" (SSM-08).
          sectorId: data.sectorId || null,
          variety: data.variety,
          lotNumber: data.lotNumber,
          quantityUsed: Number(data.quantityUsed ?? 0),
          lines: Number(data.lines ?? 0),
          meterPerLine: Number(data.meterPerLine ?? 0),
          sowingDate: new Date(data.sowingDate),
          remarks: data.remarks,
        });
      }
      router.push(`/sowing/${id}?type=${type}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  const loading = sowingQuery.isLoading;

  if (loading)
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="p-4 space-y-6">
      <button
        onClick={() => router.push(`/sowing/${id}?type=${type}`)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Sowing Record
      </button>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Sowing
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isSSM ? "SSM — Tunnel" : "LPM — Field"}
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition duration-200"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {serverError}
          </div>
        )}
        {validationProblems.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            <p className="font-semibold">
              Nothing was saved — some fields still need a value.
            </p>
            <ul className="mt-1.5 list-disc pl-5 space-y-0.5">
              {validationProblems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sowing Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Variety <span className="text-red-400 font-normal"> *</span>
              </label>
              <input
                type="text"
                {...register("variety")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Ginka"
              />
              {errors.variety && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.variety.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sowing Date <span className="text-red-400 font-normal"> *</span>
              </label>
              <input
                type="date"
                {...register("sowingDate")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {errors.sowingDate && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.sowingDate.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lot Number <span className="text-red-400 font-normal"> *</span>
              </label>
              <input
                type="text"
                {...register("lotNumber")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. 861.000"
              />
              {errors.lotNumber && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.lotNumber.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Type <span className="text-red-400 font-normal"> *</span>
              </label>
              <select
                {...register("stockType")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="BIO">BIO</option>
                <option value="CVT">CVT</option>
              </select>
            </div>
            {isSSM && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tunnel
                  </label>
                  <select
                    {...register("tunnelId")}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Not assigned yet...</option>
                    {tunnels.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.number} (capacity: {t.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                {/**
                  The peat pool (SOW-12). Changing it moves stock: the old pool gets
                  its peat back and the new one is deducted, so it is confirmed
                  before saving rather than changed by a stray tap.
                */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Peat Lot{" "}
                    <span className="text-red-400 font-normal"> *</span>
                  </label>
                  <select
                    {...register("peatLotNumber", {
                      onChange: (e) => {
                        const lotNumber = e.target.value;
                        const lot = peatItems.find(
                          (item) => item.lotNumber === lotNumber,
                        );
                        if (lot)
                          setValue(
                            "peatStockType",
                            lot.stockType as "BIO" | "CVT",
                          );
                      },
                    })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select peat lot...</option>
                    {peatItems.map((item) => (
                      <option key={item.id} value={item.lotNumber}>
                        {item.lotNumber} ({item.stockType})
                      </option>
                    ))}
                  </select>
                  {errors.peatLotNumber && (
                    <p className="mt-1 text-xs text-red-600">
                      Choose the peat lot this sowing took from.
                    </p>
                  )}
                  {/** Travels with the picker — the pair is the pool's identity. */}
                  <input type="hidden" {...register("peatStockType")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Trays{" "}
                    <span className="text-red-400 font-normal"> *</span>
                  </label>
                  <input
                    type="number"
                    {...register("numberOfTrays")}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. 50"
                    min={1}
                  />
                  {errors.numberOfTrays && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.numberOfTrays.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Seeds per Tray
                  </label>
                  <input
                    type="number"
                    {...register("seedsPerTray")}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={`${seedsPerTraySetting}`}
                    min={1}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Leave empty to keep the figure this sowing already has. The
                    farm&apos;s current one is {seedsPerTraySetting}.
                  </p>
                </div>
                {calculatedTotal && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 flex items-center gap-3">
                      <Info className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Seeds:{" "}
                          <span className="font-bold">
                            {calculatedTotal.toLocaleString()}
                          </span>
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {numberOfTrays} trays ×{" "}
                          {seedsPerTray ?? seedsPerTraySetting} seeds/tray
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {!isSSM && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sector <span className="text-red-400 font-normal"> *</span>
                  </label>
                  <select
                    {...register("sectorId")}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a sector...</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.location ? ` (${s.location})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {/**Quantity of seeds */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity of Seeds{" "}
                    <span className="text-red-400 font-normal"> *</span>
                  </label>
                  <input
                    type="number"
                    {...register("quantityUsed")}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. 5000"
                    min={1}
                  />
                  {errors.quantityUsed && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.quantityUsed.message}
                    </p>
                  )}
                </div>
                {/**Lines */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lines <span className="text-red-400 font-normal"> *</span>
                  </label>
                  <input
                    type="number"
                    {...register("lines")}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. 5000"
                    min={1}
                  />
                  {errors.lines && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.lines.message}
                    </p>
                  )}
                </div>
                {/**Line Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Line Meters{" "}
                    <span className="text-red-400 font-normal"> *</span>
                  </label>
                  <input
                    type="number"
                    {...register("meterPerLine")}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. 5000"
                    min={1}
                  />
                  {errors.meterPerLine && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.meterPerLine.message}
                    </p>
                  )}
                </div>

                {calculatedSeedsPerMeter && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      *
                    </label>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-1.5 flex items-center gap-3">
                      <Info className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Seeds/Meter:{" "}
                          <span className="font-bold">
                            {calculatedSeedsPerMeter.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remarks{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                {...register("remarks")}
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
