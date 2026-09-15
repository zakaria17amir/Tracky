import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { Paginated, ResourceItem, Role, User } from "../types";

export const adminKeys = {
  users: (page: number) => ["admin", "users", page] as const,
  user: (id: number) => ["admin", "user", id] as const,
};

export function useAdminUsers(page = 1) {
  return useQuery({
    queryKey: adminKeys.users(page),
    queryFn: async () => {
      const { data } = await api.get<Paginated<User>>("/admin/users", { params: { page } });
      return data;
    },
  });
}

export function useAdminUser(id: number | undefined) {
  return useQuery({
    queryKey: adminKeys.user(id ?? 0),
    queryFn: async () => {
      const { data } = await api.get<ResourceItem<User>>(`/admin/users/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: number; role: Role }) => {
      const { data } = await api.patch<ResourceItem<User>>(`/admin/users/${id}`, { role });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}
