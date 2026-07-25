import { api } from '../api';
import type { User, CreateUserDto } from '../types/user';

export async function getUsers(): Promise<User[]> {
  return api<User[]>('/api/users');
}

export async function getCurrentUser(): Promise<User> {
  return api<User>('/api/users/me');
}

export async function getUser(id: string): Promise<User> {
  return api<User>(`/api/users/${id}`);
}

export async function createUser(dto: CreateUserDto): Promise<User> {
  return api<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateUserRole(id: string, role: string): Promise<void> {
  await api(`/api/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}