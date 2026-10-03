import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPlantCount,
  getPlantStocks,
  type CreatePlantCountPayload,
} from "@/app/lib/services/plant-stock";

export function usePlantStocks(q?: string, stage?: string) {
  return useQuery({
    queryKey: ["plant-stock", q ?? "", stage ?? ""],
    queryFn: () => getPlantStocks(q || undefined, stage || undefined),
  });
}

/**
 * Record a plant count. Refreshes the plant-stock figures so the new
 * germination average and per-line breakdown appear straight away.
 */
export function useCreatePlantCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      plantStockId,
      payload,
    }: {
      plantStockId: string;
      payload: CreatePlantCountPayload;
    }) => createPlantCount(plantStockId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plant-stock"] });
    },
  });
}
