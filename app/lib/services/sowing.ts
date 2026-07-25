import { api } from '../api';
import type { Sowing, CreateSowingDto } from '../types/sowing';

export async function getSowings(): Promise<Sowing[]> {
  return api<Sowing[]>('/api/sowing');
}

export async function getSowing(id: string): Promise<Sowing> {
  return api<Sowing>(`/api/sowing/${id}`);
}

export async function createSowing(dto: CreateSowingDto): Promise<Sowing> {
  return api<Sowing>('/api/sowing', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateSowing(id: string, dto: CreateSowingDto): Promise<Sowing> {
  return api<Sowing>(`/api/sowing/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function deleteSowing(id: string): Promise<void> {
  await api<void>(`/api/sowing/${id}`, {
    method: 'DELETE',
  });
}
