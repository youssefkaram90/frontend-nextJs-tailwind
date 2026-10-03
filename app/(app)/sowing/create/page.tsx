"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import {
  executeSSM,
  executeLPM,
  getSowingPlan,
} from "@/app/lib/services/sowing";
import {
  useTunnels,
  useSectors,
  useStockItemsForSowing,
  useSowingPlans,
} from "@/app/lib/hooks/use-sowing";
import type { StockItem } from "@/app/lib/types/stock";
import type { Tunnel, Sector, SowingPlan } from "@/app/lib/types/sowing";
import { PlanStatus } from "@/app/lib/types/sowing";
import {
  ArrowLeft,
  Info,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  createSowingSchema,
  type SowingCreateFormInput,
  DEFAULT_SEEDS_PER_TRAY,
} from "@/app/schemas/sowing.schema";
import { ROWS_PER_LINE, seedsPerRowMetre } from "@/app/lib/sowing-constants";

const TRAYS_PER_BIG_BALL = 380;

function groupStockByVariety(items: StockItem[]) {
  const map: Record<
    string,
    { lotNumber: string; stockType: string; quantity: number }[]
  > = {};
  for (const item of items) {
    if (item.productType !== "SEEDS") continue;
    if (!map[item.productName]) map[item.productName] = [];
    map[item.productName].push({
      lotNumber: item.lotNumber,
      stockType: item.stockType,
      quantity: item.currentQuantity,
    });
  }
  return map;
}

export default function CreateSowingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [planLocation, setPlanLocation] = useState("");
  const [sectorDisplayCode, setSectorDisplayCode] = useState("");
  const [openEntry, setOpenEntry] = useState<number | null>(0);

  const { data: tunnelData } = useTunnels();
  const tunnels = (tunnelData ?? []) as Tunnel[];
  const { data: sectorData } = useSectors();
  const sectors = (sectorData ?? []) as Sector[];
  const { data } = useStockItemsForSowing();
  const stockItems = (data ?? []) as StockItem[];
  const { data: plansData } = useSowingPlans();
  const allPlans = (plansData ?? []) as SowingPlan[];

  const activePlans = useMemo(
    () => allPlans.filter((p) => p.status !== PlanStatus.COMPLETED),
    [allPlans],
  );

  const urlPlanEntryIds = searchParams.get("planEntryIds") || "";
  const urlPlanEntryId = searchParams.get("planEntryId") || "";
  const urlPlanId = searchParams.get("planId") || "";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SowingCreateFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSowingSchema) as any,
    defaultValues: {
      planId: urlPlanId,
      sowingType: "SSM",
      sowingDate: new Date().toISOString().split("T")[0],
      records: [
        {
          variety: "",
          code: "",
          lotNumber: "",
          stockType: "",
          tunnelId: "",
          sectorId: "",
          numberOfTrays: "",
          seedsPerTray: DEFAULT_SEEDS_PER_TRAY,
          quantityUsed: "",
          lines: undefined,
          metersPerLine: undefined,
          seedsPerMeter: undefined,
          remarks: "",
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "records",
  });
  const sowingType = useWatch({ control, name: "sowingType" });

  const stockMap = useMemo(() => groupStockByVariety(stockItems), [stockItems]);
  const varieties = useMemo(() => Object.keys(stockMap).sort(), [stockMap]);

  // Total seeds on hand for a variety (sum of all its lots)
  const varietyAvailable = (variety: string) =>
    (stockMap[variety] ?? []).reduce((sum, l) => sum + l.quantity, 0);

  const recordsValues = useWatch({ control, name: "records" });

  // NO auto-overwrite of seedsPerMeter: actual LPM values (lines, length, seeds/m,
  // quantity) are entered by the user and can differ from the plan.

  // Auto-fill from plan entries when coming from plan detail.
  // Supports both a single entry (?planEntryId=) and multiple (?planEntryIds=a,b,c):
  // one record is prefilled per selected entry.
  useEffect(() => {
    if (!urlPlanId) return;
    const ids = urlPlanEntryIds
      ? urlPlanEntryIds.split(",").filter(Boolean)
      : urlPlanEntryId
        ? [urlPlanEntryId]
        : [];
    if (ids.length === 0) return;

    getSowingPlan(urlPlanId)
      .then((plan) => {
        // An entry that is already executed, or that was closed on purpose, is
        // not sowable any more — the server refuses it (SPLAN-02) — so a stale
        // link must not pre-fill a record the save would reject.
        const entries = (plan.entries ?? []).filter(
          (e: any) =>
            ids.includes(e.id) &&
            e.status !== "EXECUTED" &&
            e.status !== "CLOSED",
        );
        if (entries.length === 0) return;

        // Derive sector display code from plan name + location
        const planName = plan.name;
        const loc = plan.location || "";
        if (loc && planName) {
          setPlanLocation(loc);
          const locParts = loc.trim().split(/\s+/);
          const locAbbr =
            (locParts[0]?.slice(0, 2) || "").charAt(0).toUpperCase() +
            (locParts[0]?.slice(1, 2) || "").toLowerCase() +
            (locParts[1] || "");
          const sectorNum = planName.match(/\d+/)?.[0] || "";
          if (locAbbr && sectorNum) {
            setSectorDisplayCode(`${locAbbr}-${sectorNum}`);
          }
        }

        // One record per selected entry (each keeps its own planEntryId)
        setValue("sowingType", plan.planType as "SSM" | "LPM");
        const records = entries.map((entry: any) => ({
          planEntryId: entry.id,
          variety: entry.variety,
          lotNumber: "",
          stockType: entry.stockType,
          tunnelId: "",
          sectorId: entry.sectorId ?? "",
          numberOfTrays: entry.plannedTrays ?? 0,
          seedsPerTray: DEFAULT_SEEDS_PER_TRAY,
          quantityUsed: entry.plannedQuantity ?? 0,
          lines: entry.lines ?? 0,
          code: entry.code,
          metersPerLine: entry.metersPerLine ?? undefined,
        }));
        replace(records);
      })
      .catch(() => {});
  }, [urlPlanId, urlPlanEntryIds, urlPlanEntryId, setValue, replace]);

  async function onSubmit(data: SowingCreateFormInput) {
    setSubmitting(true);
    setServerError(null);
    try {
      for (const r of data.records) {
        const base = {
          planId: data.planId,
          planEntryId: r.planEntryId || urlPlanEntryId || undefined,
          lotNumber: r.lotNumber,
          sowingDate: new Date(data.sowingDate),
          remarks: r.remarks,
        };
        if (data.sowingType === "SSM") {
          await executeSSM({
            ...base,
            variety: r.variety,
            code: r.code != null ? Number(r.code) : undefined,
            tunnelId: r.tunnelId || undefined,
            stockType: r.stockType,
            numberOfTrays: Number(r.numberOfTrays ?? 0),
            seedsPerTray: Number(r.seedsPerTray),
          });
        } else {
          await executeLPM({
            ...base,
            variety: r.variety,
            sectorId: r.sectorId || undefined,
            stockType: r.stockType,
            quantityUsed: Number(r.quantityUsed ?? 0),
            lines: Number(r.lines) || undefined,
            meterPerLine:
              r.metersPerLine != null ? Number(r.metersPerLine) : undefined,
            // seedsPerMeter is derived by the backend from the seed quantity,
            // the number of lines and the line length — never sent from here.
          });
        }
      }
      router.push("/sowing");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to create sowing",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function getLotsForVariety(variety: string) {
    return (stockMap[variety] ?? []).sort((a, b) =>
      a.lotNumber.localeCompare(b.lotNumber),
    );
  }

  return (
    <div className="p-4 space-y-6">
      <button
        onClick={() => router.push("/sowing")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Sowings
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              New Sowing
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Record sowing activities
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition duration-200"
          >
            {submitting
              ? "Creating..."
              : `Create ${fields.length > 1 ? `${fields.length} Sowings` : "Sowing"}`}
          </button>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {serverError}
          </div>
        )}

        {/* Global Fields */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Global Settings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/**Sowing Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sowing Type <span className="text-red-400 font-normal"> *</span>
              </label>
              <select
                {...register("sowingType")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="SSM">SSM — Tunnel (Tray)</option>
                <option value="LPM">LPM — Field (Direct)</option>
              </select>
            </div>

            {/**Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plan <span className="text-red-400 font-normal"> *</span>
              </label>
              <select
                {...register("planId")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select a plan...</option>
                {activePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.planType} — {p.status})
                  </option>
                ))}
              </select>
              {errors.planId && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.planId.message}
                </p>
              )}
            </div>

            {/**Sowing Date */}
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
          </div>
        </div>

        {/* Records */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sowing Records
            </h2>
            <button
              type="button"
              onClick={() => {
                append({
                  variety: "",
                  code: "",
                  lotNumber: "",
                  stockType: "",
                  tunnelId: "",
                  sectorId: "",
                  numberOfTrays: "",
                  seedsPerTray: DEFAULT_SEEDS_PER_TRAY,
                  quantityUsed: "",
                  lines: undefined,
                  metersPerLine: undefined,
                  seedsPerMeter: undefined,
                  remarks: "",
                });
                setOpenEntry(fields.length);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/30 rounded-lg transition"
            >
              <Plus className="h-4 w-4" /> Add Record
            </button>
          </div>

          {fields.map((field, index) => {
            const isOpen = openEntry === index;
            const varietyVal = recordsValues?.[index]?.variety ?? "";
            const varietyCode = recordsValues?.[index]?.code;
            const varietyLabel =
              sowingType === "SSM" && varietyCode
                ? `${varietyVal} ${String(varietyCode).trim()}`
                : varietyVal;
            const lots = getLotsForVariety(varietyVal);
            const nTrays = Number(recordsValues?.[index]?.numberOfTrays ?? 0);
            const sPerTray = Number(
              recordsValues?.[index]?.seedsPerTray ?? DEFAULT_SEEDS_PER_TRAY,
            );
            const isFromPlan = !!recordsValues?.[index]?.planEntryId;

            // ---- stock availability (see part C) ----
            const neededQty =
              sowingType === "SSM"
                ? nTrays * sPerTray
                : Number(recordsValues?.[index]?.quantityUsed ?? 0);
            const availableQty = varietyVal ? varietyAvailable(varietyVal) : 0;
            const varietyOutOfStock = !!varietyVal && availableQty <= 0;
            const varietyInsufficient =
              !!varietyVal && availableQty > 0 && neededQty > availableQty;
            const varietyHasStockIssue =
              varietyOutOfStock || varietyInsufficient;
            const lot = recordsValues?.[index]?.lotNumber;
            const seeds = recordsValues?.[index]?.quantityUsed as string;
            const total =
              sowingType === "SSM" && nTrays > 0
                ? (nTrays * sPerTray).toLocaleString()
                : null;
            const recordErrors = errors.records?.[index];

            return (
              <div
                key={field.id}
                className="rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-xl space-y-4 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenEntry(isOpen ? null : index)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {!isOpen && recordErrors && (
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                    )}
                    Record #{index + 1}
                    {varietyVal && (
                      <span className="text-gray-900 dark:text-white font-semibold">
                        - {varietyLabel} lot : {lot} Quantity :{" "}
                        {sowingType === "SSM" ? total : seeds}
                      </span>
                    )}
                  </button>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        remove(index);
                        setOpenEntry((cur) => {
                          if (cur === index) return null;
                          if (cur !== null && cur > index) return cur - 1;
                          return cur;
                        });
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Variety */}
                    {/* Variety */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Variety{" "}
                        <span className="text-red-400 font-normal"> *</span>
                      </label>

                      {isFromPlan ? (
                        <>
                          {/* value still submitted, just not editable */}
                          <input
                            type="hidden"
                            {...register(`records.${index}.variety`)}
                          />
                          <div
                            className={`w-full rounded-xl border px-3 py-2 text-sm ${
                              varietyHasStockIssue
                                ? "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200"
                                : "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-200"
                            }`}
                          >
                            {varietyVal || "—"}
                            <span className="ml-2 text-[11px] text-gray-500 dark:text-gray-400">
                              from plan
                            </span>
                          </div>
                        </>
                      ) : (
                        <select
                          {...register(`records.${index}.variety`, {
                            onChange: () => {
                              setValue(`records.${index}.lotNumber`, "");
                              setValue(`records.${index}.stockType`, "");
                            },
                          })}
                          className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            varietyHasStockIssue
                              ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30"
                              : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                          }`}
                        >
                          <option value="">Select variety...</option>
                          {varieties.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      )}

                      {varietyOutOfStock && (
                        <p className="mt-1 text-xs text-red-600">
                          No stock available for {varietyVal}
                        </p>
                      )}
                      {!varietyOutOfStock && varietyInsufficient && (
                        <p className="mt-1 text-xs text-red-600">
                          Not enough stock — need {neededQty.toLocaleString()},
                          available {availableQty.toLocaleString()}
                        </p>
                      )}
                      {recordErrors?.variety && (
                        <p className="mt-1 text-xs text-red-600">
                          {recordErrors.variety.message}
                        </p>
                      )}
                    </div>

                    {/* Code — SSM only */}
                    {sowingType === "SSM" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Code{" "}
                          <span className="text-red-400 font-normal"> *</span>
                        </label>
                        <input
                          type="number"
                          {...register(`records.${index}.code`)}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="e.g. 1"
                          min={1}
                        />
                        {recordErrors?.code && (
                          <p className="mt-1 text-xs text-red-600">
                            {recordErrors.code.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Lot Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Lot Number{" "}
                        <span className="text-red-400 font-normal"> *</span>
                      </label>
                      <select
                        {...register(`records.${index}.lotNumber`, {
                          onChange: (e) => {
                            const lotNumber = e.target.value;
                            const lot = lots.find(
                              (l) => l.lotNumber === lotNumber,
                            );
                            if (lot)
                              setValue(
                                `records.${index}.stockType`,
                                lot.stockType,
                              );
                          },
                        })}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={!varietyVal}
                      >
                        <option value="">
                          {varietyVal
                            ? "Select lot..."
                            : "Select variety first"}
                        </option>
                        {lots.map((l) => (
                          <option key={l.lotNumber} value={l.lotNumber}>
                            {l.lotNumber} ({l.stockType},{" "}
                            {l.quantity.toLocaleString()})
                          </option>
                        ))}
                      </select>
                      {recordErrors?.lotNumber && (
                        <p className="mt-1 text-xs text-red-600">
                          {recordErrors.lotNumber.message}
                        </p>
                      )}
                    </div>

                    {/* Hidden stockType — auto-filled when lot selected */}
                    <input
                      type="hidden"
                      {...register(`records.${index}.stockType`)}
                    />

                    {/* SSM */}
                    {sowingType === "SSM" && (
                      <>
                        {/* tunnel */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tunnel{" "}
                            <span className="text-gray-400 font-normal">
                              (Optionnal)
                            </span>
                          </label>
                          <select
                            {...register(`records.${index}.tunnelId`)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Not assigned yet...</option>
                            {tunnels.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.number} ({t.capacity})
                              </option>
                            ))}
                          </select>
                          {recordErrors?.tunnelId && (
                            <p className="mt-1 text-xs text-red-600">
                              {recordErrors.tunnelId.message}
                            </p>
                          )}
                        </div>
                        {/* number of trays */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Number of Trays{" "}
                            <span className="text-red-400 font-normal"> *</span>
                          </label>
                          <input
                            type="number"
                            {...register(`records.${index}.numberOfTrays`)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="e.g. 100"
                            min={1}
                          />
                          {nTrays > 0 && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Big balls used:{" "}
                              {(nTrays / TRAYS_PER_BIG_BALL).toFixed(2)} (1 ball
                              = {TRAYS_PER_BIG_BALL} trays)
                            </p>
                          )}
                          {recordErrors?.numberOfTrays && (
                            <p className="mt-1 text-xs text-red-600">
                              {recordErrors.numberOfTrays.message}
                            </p>
                          )}
                        </div>
                        {/* seeds per tray */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Seeds per Tray{" "}
                            <span className="text-red-400 font-normal"> *</span>
                          </label>
                          <input
                            type="number"
                            {...register(`records.${index}.seedsPerTray`)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder={`${DEFAULT_SEEDS_PER_TRAY}`}
                            min={1}
                          />
                        </div>
                        {/* total SSM seeds */}
                        {total && (
                          <div className="sm:col-span-2 lg:col-span-3">
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 flex items-center gap-3">
                              <Info className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                Seeds to deduct:{" "}
                                <span className="font-bold">{total}</span>{" "}
                                (seeds + peat)
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* LPM */}
                    {sowingType === "LPM" && (
                      <>
                        {(planLocation || sectorDisplayCode) && (
                          <div className="sm:col-span-2 lg:col-span-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex items-center gap-3">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                              {planLocation && (
                                <span>
                                  Location: <strong>{planLocation}</strong>
                                </span>
                              )}
                              {planLocation && sectorDisplayCode && " — "}
                              {sectorDisplayCode && (
                                <span>
                                  Sector: <strong>{sectorDisplayCode}</strong>
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Sector */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Sector{" "}
                            <span className="text-red-400 font-normal"> *</span>
                          </label>
                          <select
                            {...register(`records.${index}.sectorId`)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Select sector...</option>
                            {sectors.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                                {s.location ? ` (${s.location})` : ""}
                              </option>
                            ))}
                          </select>
                          {recordErrors?.sectorId && (
                            <p className="mt-1 text-xs text-red-600">
                              {recordErrors.sectorId.message}
                            </p>
                          )}
                        </div>

                        {/* Lines */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Lines{" "}
                            <span className="text-red-400 font-normal"> *</span>
                          </label>
                          <input
                            type="number"
                            {...register(`records.${index}.lines`, {
                              valueAsNumber: true,
                            })}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="e.g. 2 or 2.5"
                          />
                          {recordErrors?.lines && (
                            <p className="mt-1 text-xs text-red-600">
                              {recordErrors.lines.message}
                            </p>
                          )}
                        </div>

                        {/* Lines lenght  */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Line Meters{" "}
                            <span className="text-red-400 font-normal"> *</span>
                          </label>
                          <input
                            type="number"
                            {...register(`records.${index}.metersPerLine`)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="e.g. 120"
                          />
                          {recordErrors?.metersPerLine && (
                            <p className="mt-1 text-xs text-red-600">
                              {recordErrors.metersPerLine.message}
                            </p>
                          )}
                        </div>

                        {/*Seeds quantity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quantity of Seeds{" "}
                            <span className="text-red-400 font-normal"> *</span>
                          </label>
                          <input
                            type="number"
                            {...register(`records.${index}.quantityUsed`)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="e.g. 5 000"
                            min={1}
                          />
                          {recordErrors?.quantityUsed && (
                            <p className="mt-1 text-xs text-red-600">
                              {recordErrors.quantityUsed.message}
                            </p>
                          )}
                        </div>
                        {/* Computed Seeds/Meter helper */}
                        {(() => {
                          const qty = Number(
                            recordsValues?.[index]?.quantityUsed ?? 0,
                          );
                          const linesNum = Number(
                            recordsValues?.[index]?.lines ?? 0,
                          );
                          const mpl = Number(
                            recordsValues?.[index]?.metersPerLine ?? 0,
                          );
                          const spm = seedsPerRowMetre(qty, linesNum, mpl);
                          return spm > 0 ? (
                            <div className="sm:col-span-2 lg:col-span-3">
                              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 flex items-center gap-3">
                                <Info className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <p className="text-sm font-medium text-green-800 dark:text-green-300 flex-1">
                                  Computed:{" "}
                                  <span className="font-bold">
                                    {spm.toLocaleString("fr-FR")}
                                  </span>{" "}
                                  seeds/m ({qty.toLocaleString("fr-FR")} / (
                                  {linesNum} × {mpl} × {ROWS_PER_LINE}))
                                </p>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </>
                    )}

                    {/* Remarks — per record */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Remarks{" "}
                        <span className="text-gray-400 font-normal">
                          (Optionnal)
                        </span>
                      </label>
                      <input
                        type="text"
                        {...register(`records.${index}.remarks`)}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Optional notes..."
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {errors.records?.message && (
            <p className="text-sm text-red-600">{errors.records.message}</p>
          )}
        </div>
      </form>
    </div>
  );
}
