import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  getCurrentUser,
  getUser,
  createUser,
  updateUserRole,
} from "@/app/lib/services/users";
import {
  getAllPermissions,
  getUserPermissions,
  setUserPermissions,
} from "@/app/lib/services/permissions";

export function useUsers(q?: string) {
  return useQuery({
    queryKey: ["users", q ?? ""],
    queryFn: () => getUsers(q || undefined),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: getCurrentUser,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      updateUserRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useAllPermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: getAllPermissions,
  });
}

export function useUserPermissions(userId: string) {
  return useQuery({
    queryKey: ["permissions", userId],
    queryFn: () => getUserPermissions(userId),
    enabled: !!userId,
  });
}

export function useSetUserPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ids }: { userId: string; ids: string[] }) =>
      setUserPermissions(userId, ids),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["permissions", vars.userId] });
    },
  });
}
