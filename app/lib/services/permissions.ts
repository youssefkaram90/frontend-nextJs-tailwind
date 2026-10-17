import { api } from '../api';
import type { Permission } from '../types/user';

export async function getAllPermissions(): Promise<Permission[]> {
  return api<Permission[]>('/api/permissions');
}

export async function getUserPermissions(id: string): Promise<Permission[]> {
  return api<Permission[]>(`/api/permissions/users/${id}`);
}

export async function setUserPermissions(
  id: string,
  permissionIds: string[],
): Promise<Permission[]> {
  return api<Permission[]>(`/api/permissions/users/${id}`, {
    method: 'POST',
    body: JSON.stringify({ permissionIds }),
  });
}
