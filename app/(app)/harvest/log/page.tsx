"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Wheat } from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { useToast } from "@/app/lib/toast-context";
import { useCreateHarvestRecord } from "@/app/lib/hooks/use-harvest";
import { usePlantStocks } from "@/app/lib/hooks/use-plant-stock";
import { useTunnels, useSectors } from "@/app/lib/hooks/use-sowing";
import { NOT_ASSIGNED_LOCATION } from "@/app/lib/sowing-constants";

// Standard pack counts
const PACK_CVT = 410;
const PACK_BIO = 430;

export default function HarvestLogPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: tunnels = [] } = useTunnels();
  const { data: sectors = [] } = useSectors();
  const { data: stocks = [] } = usePlantStocks();
  const createHarvest = useCreateHarvestRecord();

  const [plantStockId, setPlantStockId] = useState("");
  const [productName, setProductName] = useState("");
  const [targetType, setTargetType] = useState<"TUNNEL" | "SECTOR">("TUNNEL");
  const [targetId, setTargetId] = useState("");
  const [stockType, setStockType] = useState<"CVT" | "BIO">("CVT");
  const [boxCount, setBoxCount] = useState("");
  const [plantsPerBox, setPlantsPerBox] = useState(String(PACK_CVT));
  const [harvestedAt, setHarvestedAt] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill plants-per-box for SSM (tunnels); manual for LPM (sectors)
  const switchType = (t: "TUNNEL" | "SECTOR") => {
    setTargetType(t);
    setTargetId("");
    setPlantStockId("");
    if (t === "SECTOR") setPlantsPerBox("");
    else setPlantsPerBox(String(stockType === "CVT" ? PACK_CVT : PACK_BIO));
  };

  const pickStockType = (s: "CVT" | "BIO") => {
    setStockType(s);
    setPlantsPerBox(String(s === "CVT" ? PACK_CVT : PACK_BIO));
  };

  const totalPlants = useMemo(() => {
    const boxes = parseInt(boxCount, 10) || 0;
    const perBox = parseInt(plantsPerBox, 10) || 0;
    return boxes * perBox;
  }, [boxCount, plantsPerBox]);

  // ── The batch these plants came from ──
  // Required: without it the harvest cannot be attributed to a variety and lot,
  // so harvested-vs-remaining is impossible to work out.
  const locationName =
    targetType === "TUNNEL"
      ? (tunnels.find((t) => t.id === targetId)?.number ?? "")
      : (sectors.find((s) => s.id === targetId)?.name ?? "");

  const batches = useMemo(
    () =>
      locationName
        ? stocks.filter(
            (s) => (s.location || NOT_ASSIGNED_LOCATION) === locationName,
          )
        : [],
    [stocks, locationName],
  );

  const selectedBatch = batches.find((b) => b.id === plantStockId);

  /**
   * The plant code from the box label, previewed with the same rule the server
   * applies (SSM: the batch code; LPM: box size in hundreds + sector). The
   * server derives and stores it — this is display only, so the operator can
   * check it against the physical label before saving.
   */
  const planteCodePreview = !selectedBatch
    ? ""
    : targetType === "TUNNEL"
      ? selectedBatch.code != null
        ? String(selectedBatch.code)
        : selectedBatch.lotNumber
      : `${(parseInt(plantsPerBox, 10) || 0) / 100} ${selectedBatch.location}`;

  /** Picking a batch also tells us the variety and the CVT/BIO pack. */
  const pickBatch = (id: string) => {
    setPlantStockId(id);
    const batch = stocks.find((s) => s.id === id);
    if (!batch) return;

    setProductName(batch.variety);
    if (batch.stockType === "CVT" || batch.stockType === "BIO") {
      setStockType(batch.stockType);
      if (targetType === "TUNNEL") {
        setPlantsPerBox(
          String(batch.stockType === "CVT" ? PACK_CVT : PACK_BIO),
        );
      }
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim()) {
      showToast("Product name is required", "error");
      return;
    }
    if (!targetId) {
      showToast(
        `Select a ${targetType === "TUNNEL" ? "tunnel" : "sector"}`,
        "error",
      );
      return;
    }
    if (!plantStockId) {
      showToast("Select the batch these plants came from", "error");
      return;
    }
    if (totalPlants <= 0) {
      showToast("Enter a valid box count and plants per box", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createHarvest.mutateAsync({
        productName: productName.trim(),
        targetType,
        plantStockId,
        ...(targetType === "TUNNEL"
          ? { tunnelId: targetId, stockType }
          : { sectorId: targetId }),
        boxCount: parseInt(boxCount, 10),
        plantsPerBox: parseInt(plantsPerBox, 10),
        harvestedAt,
      });
      showToast("Harvest logged");
      router.push("/harvest");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to log harvest",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Log Harvest"
        description="Record harvested produce — unit is plants"
        backTo="/harvest"
        backLabel="Back to Harvest"
      />

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-5"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Product name *
          </label>
          <input
            className={inputClass}
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Butterhead Lettuce"
          />
          {planteCodePreview ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Plant code{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {planteCodePreview}
              </span>{" "}
              — the finished-goods store separates batches by this.
            </p>
          ) : null}
        </div>

        {/* Target type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Source
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["TUNNEL", "SECTOR"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchType(t)}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  targetType === t
                    ? "border-green-600 bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                {t === "TUNNEL" ? "Tunnel (SSM)" : "Sector (LPM)"}
              </button>
            ))}
          </div>
        </div>

        {/* Location picker */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {targetType === "TUNNEL" ? "Tunnel" : "Sector"} *
          </label>
          {targetType === "TUNNEL" ? (
            <select
              className={inputClass}
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setPlantStockId("");
              }}
            >
              <option value="">— Select tunnel —</option>
              {tunnels.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.number}
                </option>
              ))}
            </select>
          ) : (
            <select
              className={inputClass}
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setPlantStockId("");
              }}
            >
              <option value="">— Select sector —</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Batch — required, and it fills in the variety + pack below */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Batch *
          </label>
          <select
            className={inputClass}
            value={plantStockId}
            onChange={(e) => pickBatch(e.target.value)}
            disabled={!targetId}
          >
            <option value="">
              {!targetId
                ? `— Select a ${targetType === "TUNNEL" ? "tunnel" : "sector"} first —`
                : batches.length === 0
                  ? "— No batches in this location —"
                  : "— Select batch —"}
            </option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.variety} {b.code}· lot {b.lotNumber}
                {b.remaining != null
                  ? ` · ${b.remaining.toLocaleString()} plants left`
                  : " · not counted"}
              </option>
            ))}
          </select>
          {selectedBatch && selectedBatch.remaining != null && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {selectedBatch.remaining.toLocaleString()} plants still standing
              in this location.
            </p>
          )}
          {selectedBatch && selectedBatch.remaining == null && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This field has not been counted yet, so how many plants are
              standing in it is not known.
            </p>
          )}
        </div>

        {/* Stock type — SSM only */}
        {targetType === "TUNNEL" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Stock type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["CVT", "BIO"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => pickStockType(s)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    stockType === s
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                  }`}
                >
                  {s} · {s === "CVT" ? PACK_CVT : PACK_BIO}/box
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Boxes & plants per box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Box count *
            </label>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={boxCount}
              onChange={(e) => setBoxCount(e.target.value)}
              placeholder="e.g. 20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Plants per box *
            </label>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={plantsPerBox}
              onChange={(e) => setPlantsPerBox(e.target.value)}
              placeholder={targetType === "SECTOR" ? "Manual" : "Auto-filled"}
            />
          </div>
        </div>

        {/* Total preview */}
        <div className="rounded-2xl bg-green-50 p-4 text-center dark:bg-green-900/20">
          <p className="text-sm text-green-700 dark:text-green-300">
            Total plants
          </p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {totalPlants.toLocaleString()}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Harvest date *
          </label>
          <input
            type="date"
            className={inputClass}
            value={harvestedAt}
            onChange={(e) => setHarvestedAt(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Wheat className="h-4 w-4" />
          {submitting ? "Logging…" : "Log harvest"}
        </button>
      </form>
    </div>
  );
}
