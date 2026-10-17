import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deletePlantCount,
  getPlantStocks,
  savePlantCount,
  type SavePlantCountPayload,
} from "@/app/lib/services/plant-stock";

export function usePlantStocks(q?: string, stage?: string) {
  return useQuery({
    queryKey: ["plant-stock", q ?? "", stage ?? ""],
    queryFn: () => getPlantStocks(q || undefined, stage || undefined),
    placeholderData: keepPreviousData,
  });
}

/**
 * Save the readings of one batch (PUT, PSTOCK-24). Refreshes the plant-stock
 * figures so the germination average and per-line breakdown appear straight away —
 * all of them are the server's answer.
 */
export function useSavePlantCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      plantStockId,
      payload,
    }: {
      plantStockId: string;
      payload: SavePlantCountPayload;
    }) => savePlantCount(plantStockId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plant-stock"] });
    },
  });
}

/**
 * Remove a count (PSTOCK-10).
 *
 * The whole list is refreshed, not one row: the germination average, the per-line
 * breakdown and `best`/`worst` are all built from every count, so removing one
 * changes figures the deleted row never appeared in.
 */
export function useDeletePlantCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (countId: string) => deletePlantCount(countId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plant-stock"] });
    },
  });
}
