"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useCreatePlantCount,
  usePlantStocks,
} from "@/app/lib/hooks/use-plant-stock";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import type { PlantStockRow } from "@/app/lib/types/plant-stock";
import { ArrowLeft, MapPin, Plus, Sprout } from "lucide-react";
import { DetailCardSkeleton } from "@/app/components/skeleton";

const inputClass =
  "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

export default function PlantStockLocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data = [], isPending, error } = usePlantStocks();

  const rows = useMemo(
    () => data.filter((r) => (r.location || "Not assigned") === id),
    [data, id],
  );

  // ── Recording a count ──
  const caps = useCaps("plant-stock");
  const createCount = useCreatePlantCount();

  const [countingRow, setCountingRow] = useState<PlantStockRow | null>(null);
  const [sampleSize, setSampleSize] = useState("");
  const [line, setLine] = useState("1");
  const [rowsInspected, setRowsInspected] = useState("7");
  const [entered, setEntered] = useState("");
  const [enterGaps, setEnterGaps] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCount(row: PlantStockRow) {
    setCountingRow(row);
    setSampleSize("");
    setLine("1");
    setRowsInspected("7");
    setEntered("");
    setEnterGaps(false);
    setFormError(null);
  }

  async function submitCount(row: PlantStockRow, sowingIsSSM: boolean) {
    const sample = Number(sampleSize);
    const value = Number(entered);

    if (!sampleSize || !Number.isFinite(sample) || sample < 1) {
      setFormError(
        sowingIsSSM
          ? "Enter how many trays you inspected (at least 1)."
          : "Enter how many samples you took (at least 1).",
      );
      return;
    }
    if (entered === "" || value < 0) {
      setFormError(
        enterGaps
          ? "Enter how many gaps you counted (0 is allowed)."
          : "Enter how many plants you counted (0 is allowed).",
      );
      return;
    }
    if (!sowingIsSSM && Number(rowsInspected) > sample) {
      setFormError("You need at least one sample for each row you inspected.");
      return;
    }

    setFormError(null);
    try {
      await createCount.mutateAsync({
        plantStockId: row.id,
        payload: {
          countType: sowingIsSSM ? "TRAY" : "ROW_METRE",
          sampleSize: sample,
          ...(enterGaps ? { missingPlants: value } : { countedPlants: value }),
          ...(sowingIsSSM
            ? { location: row.location }
            : { line: Number(line), rowsInspected: Number(rowsInspected) }),
        },
      });
      setCountingRow(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save the count.",
      );
    }
  }

  if (isPending) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <DetailCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error.message}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-4 space-y-6">
        <button
          onClick={() => router.push("/plant-stock")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Plant Stock
        </button>
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-10 text-center text-gray-500 dark:text-gray-400 shadow-xl">
          No plant stock found for “{id}”.
        </div>
      </div>
    );
  }

  const isSSM = !!rows[0].ssmSowingId;
  const totals = {
    initialStock: rows.reduce((s, r) => s + r.expectedPlants, 0),
    trays: rows.reduce((s, r) => s + (r.numberOfTrays ?? 0), 0),
    sowings: rows.length,
  };
  const varieties = [...new Set(rows.map((r) => r.variety))];

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/plant-stock")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Plant Stock
      </button>

      {/* Header card */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
            <MapPin className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {id}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isSSM ? "Tunnel (SSM)" : "Sector (LPM)"} · {varieties.join(", ")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Initial Stock
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {totals.initialStock.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sowings</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {totals.sowings.toLocaleString()}
            </p>
          </div>
          {isSSM && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Trays</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {totals.trays.toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Varieties
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {varieties.length}
            </p>
          </div>
        </div>
      </div>

      {/* Sowings in location */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <Sprout className="h-4 w-4 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sowings in {id}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                <th className="px-6 py-3 text-left font-medium">Variety</th>
                <th className="px-6 py-3 text-left font-medium">Lot</th>
                <th className="px-6 py-3 text-left font-medium">Type</th>
                {isSSM && (
                  <th className="px-6 py-3 text-left font-medium">Trays</th>
                )}
                <th className="px-6 py-3 text-left font-medium">Stage</th>
                <th className="px-6 py-3 text-right font-medium">
                  Initial Stock
                </th>
                <th className="px-6 py-3 text-left font-medium">Germination</th>
                {caps.create && <th className="px-6 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() =>
                    isSSM && r.ssmSowingId
                      ? router.push(`/sowing/${r.ssmSowingId}?type=SSM`)
                      : r.lpmSowingId
                        ? router.push(`/sowing/${r.lpmSowingId}?type=LPM`)
                        : undefined
                  }
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="px-6 py-3 font-medium text-green-600 dark:text-green-400">
                    {r.variety}
                  </td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    {r.lotNumber}
                  </td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    {r.stockType}
                  </td>
                  {isSSM && (
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                      {r.numberOfTrays?.toLocaleString() ?? "—"}
                    </td>
                  )}
                  <td className="px-6 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                      {r.currentStage}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {r.expectedPlants.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 align-top">
                    {r.countSummary?.germination != null ? (
                      <div className="space-y-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {r.countSummary.germination}%
                        </span>
                        {r.countSummary.lines.length > 0 && (
                          <div className="space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {r.countSummary.lines.map((l) => (
                              <div key={l.line}>
                                Line {l.line}: {l.germination}%
                                {l.line ===
                                  r.countSummary?.lines.reduce((a, b) =>
                                    a.germination >= b.germination ? a : b,
                                  ).line && " ★"}
                              </div>
                            ))}
                            <div className="pt-0.5 font-medium">
                              best {r.countSummary.best}% · worst{" "}
                              {r.countSummary.worst}%
                            </div>
                          </div>
                        )}
                        <div className="text-[11px] text-gray-400">
                          {r.countSummary.countCount} count
                          {r.countSummary.countCount === 1 ? "" : "s"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  {caps.create && (
                    <td className="px-6 py-3 text-right align-top">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCount(r);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
                      >
                        <Plus className="h-3.5 w-3.5" /> Count
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Record a count ── */}
      {countingRow && (
        <div className="rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Record a count
              </h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {countingRow.variety} · {countingRow.location}
                {isSSM
                  ? ` · ${countingRow.numberOfTrays?.toLocaleString() ?? "—"} trays`
                  : ` · ${countingRow.lines ?? "—"} lines`}
              </p>
            </div>
            <button
              onClick={() => setCountingRow(null)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {!isSSM && (
              <>
                <div>
                  <label className="mb-0.5 block text-xs text-gray-500">
                    Line
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={Number(countingRow.lines ?? 0) || undefined}
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-xs text-gray-500">
                    Rows inspected
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={rowsInspected}
                    onChange={(e) => setRowsInspected(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </>
            )}
            <div>
              <label className="mb-0.5 block text-xs text-gray-500">
                {isSSM ? "Trays inspected" : "Samples (1 m each)"}
              </label>
              <input
                type="number"
                min={1}
                value={sampleSize}
                onChange={(e) => setSampleSize(e.target.value)}
                placeholder={isSSM ? "e.g. 10" : "e.g. 7"}
                className={inputClass}
              />
            </div>
            <div>
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <label className="block text-xs text-gray-500">
                  {enterGaps ? "Gaps found" : "Plants found"}
                </label>
                <button
                  type="button"
                  onClick={() => setEnterGaps((v) => !v)}
                  className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400"
                >
                  count {enterGaps ? "plants" : "gaps"}
                </button>
              </div>
              <input
                type="number"
                min={0}
                value={entered}
                onChange={(e) => setEntered(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>

          {!isSSM && Number(sampleSize) > 0 && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {sampleSize} samples × 1 m ={" "}
              <span className="font-semibold">{Number(sampleSize)}</span>{" "}
              row-metres covered
            </p>
          )}

          {formError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {formError}
            </p>
          )}

          <button
            onClick={() => submitCount(countingRow, isSSM)}
            disabled={createCount.isPending}
            className="mt-4 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createCount.isPending ? "Saving…" : "Save count"}
          </button>
        </div>
      )}
    </div>
  );
}
