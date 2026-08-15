"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPlanWithEntries,
  importPlanFromExcel,
} from "@/app/lib/services/sowing";
import { SowingType } from "@/app/lib/types/sowing";
import { StockType } from "@/app/lib/types/delivery";
import {
  createSowingPlanSchema,
  type PlanCreateFormInput,
  type PlanEntryFormInput,
} from "@/app/schemas/sowing-plan.schema";
import { Banner } from "@/app/components/ui/banner";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  Sprout,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type TabMode = "manual" | "excel";

export default function CreatePlanPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabMode>("manual");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);
  const [openEntry, setOpenEntry] = useState<number | null>(0);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PlanCreateFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSowingPlanSchema) as any,
    defaultValues: {
      planName: "",
      planType: "SSM",
      location: "",
      sectorId: "",
      plannedDate: new Date().toLocaleDateString("en-CA"),
      entries: [
        {
          variety: "",
          stockType: "CVT",
          peat: "",
          plannedTrays: undefined,
          plannedQuantity: undefined,
          lines: "",
          metersPerLine: undefined,
          seedsPerMeter: undefined,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "entries",
  });

  const planType = useWatch({ control, name: "planType" });
  const watchedEntries = useWatch({ control, name: "entries" });
  const planName = useWatch({ control, name: "planName" });
  const location = useWatch({ control, name: "location" });
  const isSSM = planType === "SSM";

  // Derive sector display code: "Ha4-1" from "Hassan 4" + "Sector 1"
  const sectorCode = (() => {
    if (!location || !planName) return "";
    const locParts = location.trim().split(/\s+/);
    const locAbbr =
      (locParts[0]?.slice(0, 2) || "").charAt(0).toUpperCase() +
      (locParts[0]?.slice(1, 2) || "").toLowerCase() +
      (locParts[1] || "");
    const sectorNum = planName.match(/\d+/)?.[0] || "";
    return locAbbr && sectorNum ? `${locAbbr}-${sectorNum}` : "";
  })();

  // Sync derived sectorCode into the form so Zod validation passes
  useEffect(() => {
    setValue("sectorId", sectorCode, { shouldValidate: false });
  }, [sectorCode, setValue]);

  // ---- Excel: handle file selection ----
  const handleExcelFile = (file: File) => {
    setExcelFile(file);
    setServerError(null);
  };

  // ---- Submit ----
  const onInvalid = () => {
    setValidationError(true);
  };

  async function onSubmit(data: PlanCreateFormInput) {
    setValidationError(false);
    setSubmitting(true);
    setServerError(null);
    setSuccess(null);

    try {
      if (tab === "manual") {
        const cleanEntries = data.entries.map((e) => {
          // Auto-calculate plannedQuantity:
          // SSM: Trays × 285  |  LPM: Lines × MetersPerLine × SeedsPerMeter × 7
          let plannedQuantity: number | undefined;

          if (isSSM) {
            const trays = e.plannedTrays != null ? Number(e.plannedTrays) : 0;
            plannedQuantity = trays > 0 ? Math.round(trays * 285) : undefined;
          } else {
            const linesNum = parseFloat((e.lines || "0").replace(",", "."));
            const mpl = e.metersPerLine != null ? Number(e.metersPerLine) : 0;
            const spm = e.seedsPerMeter != null ? Number(e.seedsPerMeter) : 0;
            plannedQuantity =
              linesNum > 0 && mpl > 0 && spm > 0
                ? Math.round(linesNum * mpl * spm * 7)
                : undefined;
          }

          return {
            variety: e.variety,
            stockType: e.stockType as StockType,
            peat: e.peat,
            plannedDate: new Date(data.plannedDate),
            plannedTrays:
              e.plannedTrays != null ? Number(e.plannedTrays) : undefined,
            plannedQuantity,
            lines: e.lines,
            metersPerLine:
              e.metersPerLine != null ? Number(e.metersPerLine) : undefined,
            seedsPerMeter:
              e.seedsPerMeter != null ? Number(e.seedsPerMeter) : undefined,
          };
        });

        const plan = await createPlanWithEntries({
          planType: data.planType as SowingType,
          name: data.planName,
          location: data.location,
          sectorId: sectorCode,
          entries: cleanEntries,
        });

        setSuccess(
          `Plan "${data.planName}" created with ${cleanEntries.length} entries.`,
        );
        setTimeout(() => router.push(`/sowing/plans/${plan.id}`), 1000);
      } else {
        if (!excelFile) {
          setServerError("Please select an Excel file");
          setSubmitting(false);
          return;
        }

        const arrayBuffer = await excelFile.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        );

        const plan = await importPlanFromExcel({
          planType: data.planType as SowingType,
          name: data.planName,
          excelBase64: base64,
        });

        setSuccess(
          `Plan "${data.planName}" imported with ${plan._count?.entries ?? 0} entries.`,
        );
        setTimeout(() => router.push(`/sowing/plans/${plan.id}`), 1000);
      }
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to create plan",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Plans
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          New Sowing Plan
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a weekly plan manually or import from Excel
        </p>
      </div>

      {/* Error / Success */}
      {serverError && <Banner message={serverError} variant="error" />}
      {validationError && (
        <Banner
          message="Please fix the validation errors below before submitting."
          variant="error"
        />
      )}
      {success && <Banner message={success} variant="success" />}

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        {/* Plan Info Card */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plan Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sector 10"
                {...register("planName")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
              {errors.planName && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.planName.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plan Type
              </label>
              <select
                {...register("planType")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="SSM">SSM (Tunnel)</option>
                <option value="LPM">LPM (Field)</option>
              </select>
            </div>

            {!isSSM && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Said 1"
                  {...register("location")}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
                {errors.location && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.location.message}
                  </p>
                )}
                {sectorCode && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
                    Sector: {sectorCode}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Planned Date *
              </label>
              <input
                type="date"
                {...register("plannedDate")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
              {errors.plannedDate && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.plannedDate.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Manual / Excel */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
              tab === "manual"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Plus className="h-4 w-4" />
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setTab("excel")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
              tab === "excel"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Upload className="h-4 w-4" />
            Import Excel
          </button>
        </div>

        {/* ========== MANUAL MODE ========== */}
        {tab === "manual" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Entries ({fields.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  append({
                    variety: "",
                    stockType: "CVT",
                    peat: "",
                    plannedTrays: undefined,
                    plannedQuantity: undefined,
                    lines: "",
                    metersPerLine: undefined,
                    seedsPerMeter: undefined,
                  });
                  setOpenEntry(fields.length);
                }}
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                <Plus className="h-4 w-4" /> Add Row
              </button>
            </div>

            {errors.entries?.root && (
              <Banner
                message={errors.entries.root.message ?? "Validation error"}
                variant="error"
              />
            )}
            {errors.entries?.message &&
              typeof errors.entries.message === "string" && (
                <Banner message={errors.entries.message} variant="error" />
              )}

            {fields.map((field, idx) => {
              const isOpen = openEntry === idx;
              const variety = watchedEntries?.[idx]?.variety || "";
              return (
                <div
                  key={field.id}
                  className="rounded-xl bg-white dark:bg-gray-800 shadow p-4 space-y-3 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenEntry(isOpen ? null : idx)}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {!isOpen && errors.entries?.[idx] && (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                      Row {idx + 1}
                      {variety && (
                        <span className="text-gray-900 dark:text-white font-semibold">
                          — {variety}
                        </span>
                      )}
                    </button>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          remove(idx);
                          setOpenEntry((cur) => {
                            if (cur === idx) return null;
                            if (cur !== null && cur > idx) return cur - 1;
                            return cur;
                          });
                        }}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {isOpen && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">
                            Variety *
                          </label>
                          <input
                            type="text"
                            {...register(`entries.${idx}.variety`)}
                            className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Variety name"
                          />
                          {errors.entries?.[idx]?.variety && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.entries[idx]?.variety?.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">
                            Stock Type
                          </label>
                          <select
                            {...register(`entries.${idx}.stockType`)}
                            className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            <option value="BIO">BIO</option>
                            <option value="CVT">CVT</option>
                          </select>
                        </div>
                      </div>

                      {/* SSM-specific */}
                      {isSSM && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">
                                Planned Trays *
                              </label>
                              <input
                                type="number"
                                min="1"
                                {...register(`entries.${idx}.plannedTrays`)}
                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="e.g. 360"
                              />
                              {errors.entries?.[idx]?.plannedTrays && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.entries[idx]?.plannedTrays?.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">
                                Peat
                              </label>
                              <input
                                type="text"
                                {...register(`entries.${idx}.peat`)}
                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder='e.g. "50% CVT 50% BIO"'
                              />
                            </div>
                          </div>

                          {/* Computed Seeds Total (SSM: Trays × 285) */}
                          {(() => {
                            const trays =
                              watchedEntries?.[idx]?.plannedTrays != null
                                ? Number(watchedEntries[idx].plannedTrays)
                                : 0;
                            const total = trays * 285;
                            return (
                              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2">
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  Seeds Total
                                </span>
                                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                                  {total > 0
                                    ? total.toLocaleString("fr-FR")
                                    : "0"}
                                </p>
                              </div>
                            );
                          })()}
                        </>
                      )}

                      {/* LPM-specific */}
                      {!isSSM && (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">
                                Lines *
                              </label>
                              <input
                                type="text"
                                {...register(`entries.${idx}.lines`)}
                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="e.g. 2 or 2.5"
                              />
                              {errors.entries?.[idx]?.lines && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.entries[idx]?.lines?.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">
                                Meters/Line *
                              </label>
                              <input
                                type="number"
                                {...register(`entries.${idx}.metersPerLine`)}
                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="e.g. 120"
                              />
                              {errors.entries?.[idx]?.metersPerLine && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.entries[idx]?.metersPerLine?.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">
                                Seeds/Meter *
                              </label>
                              <input
                                type="number"
                                {...register(`entries.${idx}.seedsPerMeter`)}
                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="e.g. 120"
                              />
                              {errors.entries?.[idx]?.seedsPerMeter && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.entries[idx]?.seedsPerMeter?.message}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Computed Seeds Total (LPM: Lines × M/L × S/M × 7) */}
                          {(() => {
                            const linesNum = parseFloat(
                              (watchedEntries?.[idx]?.lines || "0").replace(
                                ",",
                                ".",
                              ),
                            );
                            const mpl =
                              watchedEntries?.[idx]?.metersPerLine != null
                                ? Number(watchedEntries[idx].metersPerLine)
                                : 0;
                            const spm =
                              watchedEntries?.[idx]?.seedsPerMeter != null
                                ? Number(watchedEntries[idx].seedsPerMeter)
                                : 0;
                            const total =
                              linesNum > 0 && mpl > 0 && spm > 0
                                ? Math.round(linesNum * mpl * spm * 7)
                                : 0;
                            return (
                              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2">
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  Seeds Total (×7)
                                </span>
                                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                                  {total > 0
                                    ? total.toLocaleString("fr-FR")
                                    : "0"}
                                </p>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {fields.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Sprout className="mx-auto h-10 w-10 mb-2" />
                <p>No entries yet. Click &quot;Add Row&quot; to start.</p>
              </div>
            )}
          </div>
        )}

        {/* ========== EXCEL MODE ========== */}
        {tab === "excel" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Excel File (.xlsx)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-green-400 transition cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleExcelFile(file);
                  }}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {excelFile
                      ? excelFile.name
                      : "Click to select an Excel file"}
                  </p>
                  {excelFile && (
                    <p className="text-xs text-green-500 mt-1 font-medium">
                      File ready — will be parsed by the server on submit
                    </p>
                  )}
                </label>
              </div>

              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Expected columns:
                </p>
                <code className="text-xs text-gray-500 dark:text-gray-400">
                  {isSSM
                    ? "variety, stockType, plannedTrays, peat"
                    : "variety, stockType, lines, metersPerLine, seedsPerMeter, sectorName, location"}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Sprout className="h-4 w-4" />
                Create Plan
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
