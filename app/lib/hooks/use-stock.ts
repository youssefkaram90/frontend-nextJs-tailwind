import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getStockItems,
  getStockItemsPage,
  getStockSummary,
  getStockItem,
  adjustStock,
} from "@/app/lib/services/stock";
import { AdjustStockInput } from "../types/stock";

/**
 * EVERY lot of the season, unpaginated.
 *
 * Kept for the two callers that need the whole list in hand: the sowing form's
 * lot pickers, and the admin's adjust dropdown — an admin must be able to pick
 * any lot, not one that happens to be on the page being viewed (STOCK-07).
 */
export function useStockItems(q?: string) {
  return useQuery({
    queryKey: ["stock", "items", q ?? ""],
    queryFn: () => getStockItems(q || undefined),
    placeholderData: keepPreviousData,
  });
}

/** One page of the list, for the stock screen. */
export function useStockItemsPage(q?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["stock", "page", q ?? "", page, pageSize],
    queryFn: () => getStockItemsPage(q || undefined, page, pageSize),
    placeholderData: keepPreviousData,
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
