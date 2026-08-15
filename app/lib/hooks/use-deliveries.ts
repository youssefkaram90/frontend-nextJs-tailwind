import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDeliveries,
  getDelivery,
  createDelivery,
  updateDelivery,
  deleteDelivery,
} from "@/app/lib/services/deliveries";

export function useDeliveries(q?: string) {
  return useQuery({
    queryKey: ["deliveries", q ?? ""],
    queryFn: () => getDeliveries(q || undefined),
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
