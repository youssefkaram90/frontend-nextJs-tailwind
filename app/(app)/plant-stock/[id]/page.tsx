"use client";

import { useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  useDeletePlantCount,
  usePlantStocks,
  useSavePlantCount,
} from "@/app/lib/hooks/use-plant-stock";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import type { PlantCount, PlantStockRow } from "@/app/lib/types/plant-stock";
import type { PlantCountSampleInput } from "@/app/lib/services/plant-stock";
import { NOT_ASSIGNED_LOCATION } from "@/app/lib/sowing-constants";
import { ArrowLeft, Loader2, MapPin, Plus, Sprout, Trash2 } from "lucide-react";
import { DetailCardSkeleton } from "@/app/components/skeleton";

const inputClass =
  "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 [appearance:textfield]";

/**
 * Read a URL segment back into a name.
 *
 * A dynamic segment arrives **percent-encoded**: the address for a location with
 * a space in it is `/plant-stock/Not%20assigned`, and the segment this page used
 * to compare against the rows was that raw text — so it matched nothing and the
 * page announced “No plant stock found for “Not%20assigned”.” (PSTOCK-23). The
 * phone already decoded; this is the web catching up.
 *
 * A stray `%` typed into the address bar would make `decodeURIComponent` throw,
 * and a malformed address should not take the page down — it just shows no rows.
 */
function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * One editable reading in the form (PSTOCK-24 → PUT, decided 2026-10-11).
 *
 * `id` is the stored reading when it came from the batch and absent for one being
 * added; the server replaces the whole list, so here it is only a stable React key.
 *
 * `gaps` says WHICH of the two numbers the value is — plants counted or gaps found.
 * Both are stored, and a correction has to hand back the one that was typed.
 */
type ReadingDraft = {
  id?: string;
  line: string;
  value: string;
  gaps: boolean;
};

/**
 * The readings already recorded for a batch, in the order they were entered, ready
 * to be edited — the form OPENS on them.
 *
 * It used to open empty with the recorded counts listed at the bottom, so the
 * readings you came to check or correct were somewhere else on the panel. A batch
 * has one count and its readings are what you keep adding to, so they are the form
 * itself: correct one in the row it is, add one on the line below, save the list.
 *
 * Readings left over from counts made before a batch had one count are read in too,
 * oldest count first: saving writes them all into the one count, keeping every
 * number.
 */
function readingsFrom(row: PlantStockRow): ReadingDraft[] {
  return (row.counts ?? []).flatMap((count) =>
    (count.samples ?? []).map((sample) => ({
      id: sample.id,
      line: String(sample.line ?? 1),
      // The reading as the operator entered it: the gaps they counted, or the
      // plants — never a re-derived figure.
      value: String(sample.missingPlants ?? sample.countedPlants),
      gaps: sample.missingPlants != null,
    })),
  );
}

export default function PlantStockLocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  // The name, decoded — see `decodeSegment` (PSTOCK-23).
  const location = decodeSegment(id);
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * WHICH KIND of location this is, from the URL (PSTOCK-20).
   *
   * The address used to be the name alone, so the page worked it out from the
   * first row it received (`rows[0]`) — and a tunnel and a sector CAN share a
   * name: an LPM sowing saved with no sector stored a blank location, which both
   * screens print as "Not assigned", the same bucket as a tunnel batch whose
   * trays have not been transported. One page then mixed the two kinds and the
   * title, the Trays column and the count form all followed whichever rack
   * happened to come back first.
   *
   * The link on the list already knows the tab it came from, so it says so. This
   * is the same convention `/sowing/<id>?type=` uses.
   */
  const type = searchParams.get("type") === "LPM" ? "LPM" : "SSM";
  const isSSM = type === "SSM";

  const { data = [], isPending, error } = usePlantStocks();

  const rows = useMemo(
    () =>
      data.filter(
        (r) =>
          (r.location || NOT_ASSIGNED_LOCATION) === location &&
          (type === "SSM" ? !!r.ssmSowingId : !!r.lpmSowingId),
      ),
    [data, location, type],
  );

  // ── Recording a count ──
  const caps = useCaps("plant-stock");
  // ONE call for the batch's readings, saved whole (PSTOCK-24 → PUT).
  const saveCount = useSavePlantCount();
  // Removing one is the same act, so it rides the same permission (PSTOCK-10).
  const deleteCount = useDeletePlantCount();

  /**
   * WHICH row the panel is open on, by id — not the row itself.
   *
   * The panel shows the readings stored for the batch, and they change the moment
   * one is removed. A copy of the row taken when the panel opened kept showing the
   * deleted count (PSTOCK-10), so the row is looked up in the live list instead.
   */
  const [countingRowId, setCountingRowId] = useState<string | null>(null);
  const countingRow =
    countingRowId === null
      ? null
      : (rows.find((r) => r.id === countingRowId) ?? null);

  /**
   * The readings in the form: the batch's own first, in the order they were taken,
   * then whatever is added below. Saving sends this whole list.
   */
  const [readings, setReadings] = useState<ReadingDraft[]>([]);
  /** The single line additions come from: [line] [number] [+ Add reading]. */
  const [newLine, setNewLine] = useState("1");
  const [newValue, setNewValue] = useState("");
  /**
   * Whether the numbers being typed are GAPS instead of plants. Existing rows keep
   * the kind they were recorded with; this only applies to what is added next.
   */
  const [enterGaps, setEnterGaps] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingCountId, setDeletingCountId] = useState<string | null>(null);
  /** Kept on the number box so Enter leaves the hands where they were. */
  const addInputRef = useRef<HTMLInputElement | null>(null);

  /** The lines this sowing has (LPM) — a reading may come from any of them. */
  const lineNumbers = useMemo(
    () => Array.from({ length: countingRow?.lines ?? 0 }, (_, i) => i + 1),
    [countingRow],
  );

  // A running count while typing — never a computed figure. Density, estimated
  // plants and germination are the server's, and it is the only place that knows
  // how many seeds a reading was owed (PSTOCK-24). Plants and gaps are added up
  // apart: they are different questions about the same tray.
  const plantsTyped = readings
    .filter((r) => !r.gaps)
    .reduce((sum, r) => sum + (Number(r.value) || 0), 0);
  const gapsTyped = readings
    .filter((r) => r.gaps)
    .reduce((sum, r) => sum + (Number(r.value) || 0), 0);

  function openCount(row: PlantStockRow) {
    setCountingRowId(row.id);
    // The batch's own readings, not an empty form.
    setReadings(readingsFrom(row));
    setNewLine("1");
    setNewValue("");
    setEnterGaps(false);
    setFormError(null);
  }

  function closeCountPanel() {
    setCountingRowId(null);
    setReadings([]);
    setNewValue("");
    setFormError(null);
  }

  function setReadingValue(index: number, value: string) {
    setReadings((prev) =>
      prev.map((r, i) => (i === index ? { ...r, value } : r)),
    );
  }

  function setReadingLine(index: number, line: string) {
    setReadings((prev) =>
      prev.map((r, i) => (i === index ? { ...r, line } : r)),
    );
  }

  function removeReading(index: number) {
    setReadings((prev) => prev.filter((_, i) => i !== index));
  }

  /**
   * Add the reading in the line below to the list above.
   *
   * One reading at a time: type the number, press Enter, type the next. The reading
   * joins the list straight away, so a tray you have already counted is visible
   * rather than sitting in a field you might overwrite.
   */
  function addReading() {
    const value = newValue.trim();
    if (value === "") return;

    setReadings((prev) => [...prev, { line: newLine, value, gaps: enterGaps }]);
    setNewValue("");
    addInputRef.current?.focus();
  }

  /**
   * The whole list, as the API wants it (the list IS the count — PUT).
   *
   * Only shape checks live here (a whole number, at least one reading); whether the
   * line exists, whether the gaps fit the seeds, and every figure, are the server's
   * — it is the one place that knows what the sowing was given.
   */
  function readingsFromForm(): PlantCountSampleInput[] {
    if (readings.length === 0) {
      throw new Error("Add at least one reading.");
    }

    return readings.map((r, index) => {
      const value = Number(r.value);
      if (r.value.trim() === "" || !Number.isInteger(value) || value < 0) {
        throw new Error(
          `Reading ${index + 1}: enter a whole number (0 is allowed).`,
        );
      }
      return {
        ...(isSSM ? {} : { line: Number(r.line) }),
        ...(r.gaps ? { missingPlants: value } : { countedPlants: value }),
      };
    });
  }

  async function submitCount(row: PlantStockRow) {
    let samples: PlantCountSampleInput[];
    try {
      samples = readingsFromForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the readings.");
      return;
    }

    setFormError(null);
    try {
      await saveCount.mutateAsync({
        plantStockId: row.id,
        payload: {
          countType: isSSM ? "TRAY" : "ROW_METRE",
          // The tunnel travels in the body: an SSM batch spread over two tunnels is
          // counted once per tunnel, and each keeps its own readings.
          ...(isSSM ? { location: row.location } : {}),
          samples,
        },
      });
      closeCountPanel();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save the readings.",
      );
    }
  }

  /**
   * Delete one count, after asking (PSTOCK-10).
   *
   * A batch has ONE count, so this removes the readings recorded for that tunnel
   * or line and the batch shows no germination figure until it is counted again.
   * Correcting a number is done in the rows above — this is for a count that should
   * not be there at all, which is why it is worth a question.
   */
  async function handleDeleteCount(row: PlantStockRow, count: PlantCount) {
    const where = count.line != null ? `line ${count.line}` : row.location;
    const howMany = count.samples?.length ?? count.sampleSize;

    if (
      !confirm(
        `Delete the ${howMany} recorded reading${howMany === 1 ? "" : "s"} for ` +
          `${where}? The batch shows no germination figure until you count again.`,
      )
    ) {
      return;
    }

    setFormError(null);
    setDeletingCountId(count.id);
    try {
      await deleteCount.mutateAsync(count.id);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not delete the count.",
      );
    } finally {
      setDeletingCountId(null);
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
          No plant stock found for “{location}”.
        </div>
      </div>
    );
  }

  const totals = {
    initialStock: rows.reduce((s, r) => s + r.expectedPlants, 0),
    // Trays in THIS location — every row here is one of them, so the batch's own
    // tray count is right (the list's "Trays in tunnels" card is the one that had
    // to change to `inTunnel`, PSTOCK-22).
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
              {location}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isSSM ? "Tunnel (SSM)" : "Sector (LPM)"} · {varieties.join(", ")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isSSM ? "Initial Stock" : "Seeds sown"}
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
            Sowings in {location}
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
                  {isSSM ? "Initial Stock" : "Seeds sown"}
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
                                {/* The server says which line is the best one
                                    (PSTOCK-19) — this used to be worked out
                                    again here with a `reduce`. */}
                                {l.isBest && " ★"}
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
                Readings
              </h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {countingRow.variety} · {countingRow.location}
                {isSSM
                  ? ` · ${countingRow.numberOfTrays?.toLocaleString() ?? "—"} trays`
                  : ` · ${countingRow.lines ?? "—"} lines`}
              </p>
            </div>
            <button
              onClick={closeCountPanel}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>

          {/*
            A batch keeps ONE count now (user, 2026-10-11). Counts left over from
            before that are listed here, because saving merges them into one —
            keeping every reading, which is the point of saying so.
          */}
          {countingRow.counts && countingRow.counts.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-700/30">
              {countingRow.counts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                >
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {c.germinationRate != null ? `${c.germinationRate}%` : "—"}
                  </span>
                  <span>
                    {c.samples?.length ?? c.sampleSize} reading
                    {(c.samples?.length ?? c.sampleSize) === 1 ? "" : "s"}
                  </span>
                  {!isSSM && c.line != null && <span>· line {c.line}</span>}
                  <span>
                    · {new Date(c.createdAt).toLocaleDateString("en-GB")}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCount(countingRow, c)}
                    disabled={deletingCountId === c.id}
                    title="Delete the readings recorded for this batch — the germination figure goes with them"
                    className="shrink-0 text-red-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {deletingCountId === c.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {countingRow.counts && countingRow.counts.length > 1 && (
            <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              This batch holds {countingRow.counts.length} counts, recorded
              before a batch kept one. Saving merges them into one count and
              keeps every reading; the batch then shows a single germination
              figure, which the server works out.
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <label className="block text-xs text-gray-500">
              Readings, in the order you took them
            </label>
            <button
              type="button"
              onClick={() => setEnterGaps((v) => !v)}
              title="Switch what the readings you add next are: the plants you counted, or the gaps you found"
              className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400"
            >
              add {enterGaps ? "plants" : "gaps"} instead
            </button>
          </div>

          {readings.length === 0 && (
            <p className="mt-2 rounded-xl border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400 dark:border-gray-700">
              Nothing recorded for this batch yet — add your first reading
              below.
            </p>
          )}

          {/*
            The readings sit SIDE BY SIDE, wrapping (user, 2026-10-11).

            One full-width row each made ten readings a column taller than the
            panel, and the SHAPE of the count — ten trays all about the same
            number, or one bad tray among them — was invisible. A wrapped strip of
            boxes puts the whole count in front of the operator at once, and a
            reading is corrected in the box it is.
          */}
          <div className="mt-2 flex flex-wrap gap-2">
            {readings.map((r, index) => (
              <div
                key={r.id ?? `new-${index}`}
                className={
                  r.gaps
                    ? "w-[74px] rounded-xl border border-amber-300 bg-amber-50 p-1.5 dark:border-amber-700 dark:bg-amber-900/20"
                    : "w-[74px] rounded-xl border border-gray-200 bg-white p-1.5 dark:border-gray-700 dark:bg-gray-800"
                }
              >
                <input
                  type="number"
                  min={0}
                  value={r.value}
                  onChange={(e) => setReadingValue(index, e.target.value)}
                  placeholder="0"
                  title={`Reading ${index + 1}${r.gaps ? " — gaps counted" : ""}`}
                  className="w-full rounded-lg border-0 bg-transparent px-0 py-1 text-center text-sm font-semibold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 [appearance:textfield] dark:text-white"
                />
                <div className="flex items-center justify-between px-0.5">
                  {/*
                    The footer of the box: which line it came from (LPM), and the
                    × that takes it out. A tray belongs to no line, so there the
                    footer carries the reading's number instead.
                  */}
                  {isSSM ? (
                    <span className="text-[10px] text-gray-400">
                      {index + 1}
                    </span>
                  ) : (
                    <select
                      value={r.line}
                      onChange={(e) => setReadingLine(index, e.target.value)}
                      title={`The line reading ${index + 1} came from`}
                      className="border-0 bg-transparent p-0 text-[10px] text-gray-400 focus:outline-none dark:bg-gray-800"
                    >
                      {lineNumbers.map((n) => (
                        <option key={n} value={n}>
                          L{n}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => removeReading(index)}
                    title="Remove this reading"
                    className="text-xs leading-none text-gray-300 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {readings.some((r) => r.gaps) && (
            <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              Amber boxes are readings where you counted the gaps, not the
              plants.
            </p>
          )}

          {/* One line to add one reading: type the number, press Enter. */}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50/50 p-2 dark:border-green-900/50 dark:bg-green-900/10">
            {!isSSM && lineNumbers.length > 0 && (
              <select
                value={newLine}
                onChange={(e) => setNewLine(e.target.value)}
                className="w-24 shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {lineNumbers.map((n) => (
                  <option key={n} value={n}>
                    line {n}
                  </option>
                ))}
              </select>
            )}
            <input
              ref={addInputRef}
              type="number"
              min={0}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addReading();
                }
              }}
              placeholder={
                enterGaps ? "gaps in this reading" : "plants in this reading"
              }
              className={inputClass}
            />
            <button
              type="button"
              onClick={addReading}
              disabled={newValue.trim() === ""}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Add reading
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Enter adds the reading and leaves you on the line for the next one.
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold">{readings.length}</span> reading
              {readings.length === 1 ? "" : "s"}
              {plantsTyped > 0 && (
                <>
                  {" · "}
                  <span className="font-semibold">{plantsTyped}</span> plants
                </>
              )}
              {gapsTyped > 0 && (
                <>
                  {" · "}
                  <span className="font-semibold">{gapsTyped}</span> gaps
                </>
              )}
            </p>
            <p className="text-xs text-gray-400">
              Every figure on this page is the server&apos;s.
            </p>
          </div>

          {formError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {formError}
            </p>
          )}

          <button
            onClick={() => submitCount(countingRow)}
            disabled={saveCount.isPending}
            className="mt-4 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveCount.isPending ? "Saving…" : "Save readings"}
          </button>
        </div>
      )}
    </div>
  );
}
