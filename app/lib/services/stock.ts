import { api } from '../api';
import type { StockItem, StockMovement, StockSummary } from '../types/stock';

export async function getStockItems(): Promise<StockItem[]> {
  return api<StockItem[]>('/api/stock');
}

export async function getStockSummary(): Promise<StockSummary> {
  return api<StockSummary>('/api/stock/summary');
}

export async function getStockItem(id: string): Promise<StockItem> {
  return api<StockItem>(`/api/stock/${id}`);
}

export async function getStockMovements(id: string): Promise<StockMovement[]> {
  return api<StockMovement[]>(`/api/stock/${id}/movements`);
}
