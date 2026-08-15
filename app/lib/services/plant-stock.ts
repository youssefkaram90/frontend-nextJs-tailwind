import { api } from "../api";
import type { PlantStockRow } from "../types/plant-stock";

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
