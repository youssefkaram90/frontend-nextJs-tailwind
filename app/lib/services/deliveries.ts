import { api } from "../api";
import type { Delivery, CreateDeliveryDto } from "../types/delivery";
import type { Paginated } from "../types/pagination";

/**
 * One page of deliveries.
 *
 * The endpoint only answers the `Paginated` envelope when `page` is sent — with
 * no page it returns the whole season as a plain array, which is what the list
 * screen used to download in one request (DEL-2).
 */
export async function getDeliveriesPage(
  q?: string,
  page = 1,
  pageSize = 20,
): Promise<Paginated<Delivery>> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return api<Paginated<Delivery>>(`/api/deliveries?${params.toString()}`);
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
