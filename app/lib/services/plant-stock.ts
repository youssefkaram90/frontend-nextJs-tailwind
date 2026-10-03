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
 * Record a sample count for one sowing.
 *
 * Supply EITHER `countedPlants` (plants present) or `missingPlants` (gaps) —
 * never both. For SSM send `location` (the tunnel); for LPM send `line` and
 * `rowsInspected`. Every figure the screen shows (density, estimated plants,
 * germination) is calculated by the server from the sample — the client never
 * computes them.
 */
export interface CreatePlantCountPayload {
  countType: "TRAY" | "ROW_METRE";
  /** SSM: trays inspected. LPM: 1-metre samples = row-metres covered. */
  sampleSize: number;
  countedPlants?: number;
  missingPlants?: number;
  /** SSM only — the tunnel being counted. */
  location?: string;
  /** LPM only — which line was sampled. */
  line?: number;
  /** LPM only — how many of the 7 rows were covered. */
  rowsInspected?: number;
  notes?: string;
}

export async function createPlantCount(
  plantStockId: string,
  payload: CreatePlantCountPayload,
): Promise<PlantCount> {
  return api<PlantCount>(`/api/plant-stock/${plantStockId}/counts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
