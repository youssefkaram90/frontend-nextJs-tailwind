import { useQuery } from "@tanstack/react-query";
import {
  getStockItems,
  getStockSummary,
  getStockItem,
} from "@/app/lib/services/stock";

export function useStockItems(q?: string) {
  return useQuery({
    queryKey: ["stock", "items", q ?? ""],
    queryFn: () => getStockItems(q || undefined),
  });
}

export function useStockSummary() {
  return useQuery({
    queryKey: ["stock", "summary"],
    queryFn: getStockSummary,
  });
}

export function useStockItem(id: string) {
  return useQuery({
    queryKey: ["stock", id],
    queryFn: () => getStockItem(id),
    enabled: !!id,
  });
}
