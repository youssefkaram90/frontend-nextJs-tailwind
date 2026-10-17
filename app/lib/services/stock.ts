import { api } from "../api";
import type {
  AdjustStockInput,
  StockItem,
  StockSummary,
} from "../types/stock";
import type { Paginated } from "../types/pagination";

export async function getStockItems(q?: string): Promise<StockItem[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return api<StockItem[]>(`/api/stock${params}`);
}

/**
 * One page of lots.
 *
 * The endpoint answers a plain array until it is sent `page`/`pageSize`, so
 * these two params are what switch it to the envelope — which is how the stock
 * screen stops downloading a whole season in one response (STOCK-07).
 */
export async function getStockItemsPage(
  q?: string,
  page = 1,
  pageSize = 20,
): Promise<Paginated<StockItem>> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return api<Paginated<StockItem>>(`/api/stock?${params.toString()}`);
}

export async function getStockSummary(): Promise<StockSummary> {
  return api<StockSummary>("/api/stock/summary");
}

export async function getStockItem(id: string): Promise<StockItem> {
  return api<StockItem>(`/api/stock/${id}`);
}

export async function adjustStock(dto: AdjustStockInput): Promise<StockItem> {
  return api<StockItem>("/api/stock/adjust", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}
