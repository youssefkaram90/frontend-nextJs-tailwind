import { useQuery } from "@tanstack/react-query";
import { getPlantStocks } from "@/app/lib/services/plant-stock";

export function usePlantStocks(q?: string, stage?: string) {
  return useQuery({
    queryKey: ["plant-stock", q ?? "", stage ?? ""],
    queryFn: () => getPlantStocks(q || undefined, stage || undefined),
  });
}
