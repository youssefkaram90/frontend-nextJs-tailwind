import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStockItems,
  getStockSummary,
  getStockItem,
  adjustStock,
} from "@/app/lib/services/stock";
import { AdjustStockInput } from "../types/stock";

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

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AdjustStockInput) => adjustStock(dto),
    onSuccess: () => {
      // The quantity moved and a movement was written, so both lists are stale.
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}
