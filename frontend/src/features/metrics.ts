import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { Metric, MetricType, ResourceCollection, ResourceItem } from "../types";

export interface MetricInput {
  name: string;
  description?: string | null;
  type: MetricType;
  unit?: string | null;
  scale_min?: number | null;
  scale_max?: number | null;
  is_active?: boolean;
}

export const metricKeys = {
  all: ["metrics"] as const,
  list: (activeOnly?: boolean) => ["metrics", { activeOnly }] as const,
  detail: (id: number) => ["metrics", id] as const,
};

export function useMetrics(activeOnly = false) {
  return useQuery({
    queryKey: metricKeys.list(activeOnly),
    queryFn: async () => {
      const { data } = await api.get<ResourceCollection<Metric>>("/metrics", {
        params: activeOnly ? { active_only: 1 } : {},
      });
      return data.data;
    },
  });
}

export function useCreateMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MetricInput) => {
      const { data } = await api.post<ResourceItem<Metric>>("/metrics", input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: metricKeys.all }),
  });
}

export function useUpdateMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: Partial<MetricInput> }) => {
      const { data } = await api.patch<ResourceItem<Metric>>(`/metrics/${id}`, input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: metricKeys.all }),
  });
}

export function useDeleteMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/metrics/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: metricKeys.all }),
  });
}
