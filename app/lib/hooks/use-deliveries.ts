import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getDeliveriesPage,
  getDelivery,
  createDelivery,
  updateDelivery,
  deleteDelivery,
} from "@/app/lib/services/deliveries";

/** One page of the list, for the deliveries screen. */
export function useDeliveriesPage(q?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["deliveries", "page", q ?? "", page, pageSize],
    queryFn: () => getDeliveriesPage(q || undefined, page, pageSize),
    // Keep the current list snapshot when returning from delivery creation.
    // It can be refreshed explicitly when the user chooses to reload the list.
    staleTime: Infinity,
    // The page stays on screen while a search or a page turn loads: without
    // this the whole screen (search box included) was replaced by a spinner on
    // every search, which is what made typing feel jumpy.
    placeholderData: keepPreviousData,
  });
}

/**
 * Just the newest few, for the dashboard. `pageSize` is the point: the dashboard
 * used to download the whole season to show five rows (DEL-2).
 */
export function useRecentDeliveries(pageSize = 5) {
  return useQuery({
    queryKey: ["deliveries", "recent", pageSize],
    queryFn: () => getDeliveriesPage(undefined, 1, pageSize),
  });
}

export function useDelivery(id: string) {
  return useQuery({
    queryKey: ["deliveries", id],
    queryFn: () => getDelivery(id),
    enabled: !!id,
  });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDelivery,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });
}

export function useUpdateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Parameters<typeof updateDelivery>[1]) =>
      updateDelivery(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });
}

export function useDeleteDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDelivery,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });
}
