import { api } from "../api";
import type { AdjustStockInput, StockItem, StockMovement, StockSummary } from "../types/stock";

export async function getStockItems(q?: string): Promise<StockItem[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return api<StockItem[]>(`/api/stock${params}`);
}

export async function getStockSummary(): Promise<StockSummary> {
  return api<StockSummary>("/api/stock/summary");
}

export async function getStockItem(id: string): Promise<StockItem> {
  return api<StockItem>(`/api/stock/${id}`);
}

export async function getStockMovements(id: string): Promise<StockMovement[]> {
  return api<StockMovement[]>(`/api/stock/${id}/movements`);
}

export async function adjustStock(dto: AdjustStockInput): Promise<StockItem> {
  return api<StockItem>("/api/stock/adjust", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}
