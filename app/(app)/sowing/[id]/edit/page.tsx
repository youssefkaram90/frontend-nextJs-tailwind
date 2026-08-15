"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { updateSowingSSM, updateSowingLPM } from "@/app/lib/services/sowing";
import {
  useTunnels,
  useSectors,
  useSowingSSM,
  useSowingLPM,
} from "@/app/lib/hooks/use-sowing";
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

export default function EditSowingPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "SSM";
  const router = useRouter();
  const isSSM = type === "SSM";
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { data: tunnelData } = useTunnels();
  const tunnels = (tunnelData ?? []) as Tunnel[];
  const { data: sectorData } = useSectors();
  const sectors = (sectorData ?? []) as Sector[];
  const ssmQuery = useSowingSSM(isSSM ? id : "");
  const lpmQuery = useSowingLPM(!isSSM ? id : "");
  const sowingQuery = isSSM ? ssmQuery : lpmQuery;

  const {
    register,
    handleSubmit,
    control,
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
      remarks: "",
    },
  });

  const numberOfTrays = useWatch({ control, name: "numberOfTrays" }) as
    | number
    | undefined;
  const seedsPerTray = useWatch({ control, name: "seedsPerTray" }) as
    | number
    | undefined;
  const calculatedTotal =
    isSSM && numberOfTrays && seedsPerTray
      ? Number(numberOfTrays) * (Number(seedsPerTray) || DEFAULT_SEEDS_PER_TRAY)
      : null;

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
      tunnelId: isSSM ? (sowing as SowingSSM).tunnelId : "",
      sectorId: !isSSM ? (sowing as SowingLPM).sectorId : "",
    });
  }, [sowingQuery.data, reset, isSSM]);

  async function onSubmit(data: EditSowingFormData) {
    setSubmitting(true);
    setServerError(null);
    try {
      if (isSSM) {
        await updateSowingSSM(id, {
          planId: data.planId,
          planEntryId: undefined,
          tunnelId: data.tunnelId || undefined,
          variety: data.variety,
          lotNumber: data.lotNumber,
          numberOfTrays: Number(data.numberOfTrays ?? 0),
          seedsPerTray: Number(data.seedsPerTray),
          sowingDate: new Date(data.sowingDate),
          remarks: data.remarks,
        });
      } else {
        await updateSowingLPM(id, {
          planId: data.planId,
          planEntryId: undefined,
          sectorId: data.sectorId!,
          variety: data.variety,
          lotNumber: data.lotNumber,
          quantityUsed: Number(data.quantityUsed ?? 0),
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
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition duration-200"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {serverError}
          </div>
        )}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sowing Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Variety *
              </label>
              <input
                type="text"
                {...register("variety")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
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
                Sowing Date *
              </label>
              <input
                type="date"
                {...register("sowingDate")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              {errors.sowingDate && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.sowingDate.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lot Number *
              </label>
              <input
                type="text"
                {...register("lotNumber")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
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
                Stock Type *
              </label>
              <select
                {...register("stockType")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value="">Not assigned yet...</option>
                    {tunnels.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.number} (capacity: {t.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Trays *
                  </label>
                  <input
                    type="number"
                    {...register("numberOfTrays")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder={`${DEFAULT_SEEDS_PER_TRAY}`}
                    min={1}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Default: {DEFAULT_SEEDS_PER_TRAY}
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
                          {seedsPerTray ?? DEFAULT_SEEDS_PER_TRAY} seeds/tray
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
                    Sector *
                  </label>
                  <select
                    {...register("sectorId")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity of Seeds *
                  </label>
                  <input
                    type="number"
                    {...register("quantityUsed")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="e.g. 5000"
                    min={1}
                  />
                  {errors.quantityUsed && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.quantityUsed.message}
                    </p>
                  )}
                </div>
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
