import { api } from "../api";
import type { PlantCount, PlantStockRow } from "../types/plant-stock";

export async function getPlantStocks(
  q?: string,
  stage?: string,
): Promise<PlantStockRow[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (stage) params.set("stage", stage);
  const qs = params.toString();
  return api<PlantStockRow[]>(`/api/plant-stock${qs ? `?${qs}` : ""}`);
}

/**
 * The readings for one batch — saved whole.
 *
 * One entry per SAMPLE, in the order they were taken — a tray (SSM) or one metre
 * of one row (LPM, which says which line). Every figure the screen shows (density,
 * estimated plants, germination) is calculated by the server from them
 * (PSTOCK-24); the client never computes one.
 *
 * Supply EITHER `countedPlants` or `missingPlants` per reading — never both, and
 * never a total: the total IS the readings.
 */
export interface PlantCountSampleInput {
  /** LPM only — the line this reading came from (1..lines) */
  line?: number;
  countedPlants?: number;
  missingPlants?: number;
}

export interface SavePlantCountPayload {
  countType: "TRAY" | "ROW_METRE";
  /**
   * SSM only — the tunnel being counted. A batch spread over two tunnels is
   * counted once per tunnel, each with its own readings.
   */
  location?: string;
  /** The COMPLETE list. This is what the count is, not an addition to it. */
  samples: PlantCountSampleInput[];
  notes?: string;
}

/**
 * Save the readings of one batch (PUT, PSTOCK-24 → decided 2026-10-11).
 *
 * A batch has ONE count with ONE germination figure, and the readings are what you
 * add to it — so adding a reading, correcting a typo and taking one back are all
 * the same act: send the whole list. The server merges it into the batch's count
 * and hands the row back as it now stands.
 */
export async function savePlantCount(
  plantStockId: string,
  payload: SavePlantCountPayload,
): Promise<PlantCount> {
  return api<PlantCount>(`/api/plant-stock/${plantStockId}/counts`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Take one count back out (PSTOCK-10).
 *
 * Every count is averaged into the germination figure of that tunnel or line, so
 * a mistyped sample has to be removable — otherwise a wrong number stays in the
 * average for ever. The id here is the COUNT's, not the batch's.
 */
export async function deletePlantCount(
  countId: string,
): Promise<{ message: string; plantStockId: string }> {
  return api<{ message: string; plantStockId: string }>(
    `/api/plant-stock/counts/${countId}`,
    { method: "DELETE" },
  );
}
