import { api } from "../api";
import type { Delivery, CreateDeliveryDto } from "../types/delivery";

export async function getDeliveries(q?: string): Promise<Delivery[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return api<Delivery[]>(`/api/deliveries${params}`);
}

export async function getDelivery(id: string): Promise<Delivery> {
  return api<Delivery>(`/api/deliveries/${id}`);
}

export async function createDelivery(
  dto: CreateDeliveryDto,
): Promise<Delivery> {
  return api<Delivery>("/api/deliveries", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateDelivery(
  id: string,
  dto: CreateDeliveryDto,
): Promise<Delivery> {
  return api<Delivery>(`/api/deliveries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export async function deleteDelivery(id: string): Promise<void> {
  await api<void>(`/api/deliveries/${id}`, {
    method: "DELETE",
  });
}
