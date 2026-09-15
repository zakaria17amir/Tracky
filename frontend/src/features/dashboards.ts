import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { Dashboard, ResourceCollection, ResourceItem } from "../types";

export interface DashboardInput {
  name: string;
  description?: string | null;
}

export const dashboardKeys = {
  all: ["dashboards"] as const,
  detail: (id: number) => ["dashboards", id] as const,
};

export function useDashboards() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: async () => {
      const { data } = await api.get<ResourceCollection<Dashboard>>("/dashboards");
      return data.data;
    },
  });
}

export function useDashboard(id: number | undefined) {
  return useQuery({
    queryKey: dashboardKeys.detail(id ?? 0),
    queryFn: async () => {
      const { data } = await api.get<ResourceItem<Dashboard>>(`/dashboards/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DashboardInput) => {
      const { data } = await api.post<ResourceItem<Dashboard>>("/dashboards", input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: dashboardKeys.all }),
  });
}

export function useUpdateDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: Partial<DashboardInput> }) => {
      const { data } = await api.patch<ResourceItem<Dashboard>>(`/dashboards/${id}`, input);
      return data.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
      qc.invalidateQueries({ queryKey: dashboardKeys.detail(vars.id) });
    },
  });
}

export function useDeleteDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/dashboards/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: dashboardKeys.all }),
  });
}
