import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  Entry,
  EntryValue,
  MetricSummaryData,
  Paginated,
  ResourceCollection,
  ResourceItem,
} from "../types";

export interface EntryFilters {
  metric_id?: number;
  from?: string;
  to?: string;
  page?: number;
}

export interface BulkEntryRow {
  metric_id: number;
  logged_date: string;
  value: EntryValue;
  notes?: string | null;
}

export const entryKeys = {
  all: ["entries"] as const,
  list: (filters: EntryFilters) => ["entries", filters] as const,
  metricEntries: (metricId: number) => ["metric-entries", metricId] as const,
};

export function useEntries(filters: EntryFilters = {}) {
  return useQuery({
    queryKey: entryKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<Entry>>("/entries", { params: filters });
      return data;
    },
    staleTime: 0,
  });
}

/** Chart data source for a single metric. */
export function useMetricEntries(metricId: number, params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: [...entryKeys.metricEntries(metricId), params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Entry>>(`/metrics/${metricId}/entries`, {
        params: { ...params, per_page: 100 },
      });
      return data.data;
    },
    staleTime: 0,
  });
}

/** Server-computed stat + streak over a metric's full history. */
export function useMetricSummary(metricId: number, threshold = 1) {
  return useQuery({
    queryKey: ["metric-summary", metricId, threshold],
    queryFn: async () => {
      const { data } = await api.get<MetricSummaryData>(`/metrics/${metricId}/summary`, {
        params: { threshold },
      });
      return data;
    },
    staleTime: 0,
  });
}

function invalidateEntries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: entryKeys.all });
  qc.invalidateQueries({ queryKey: ["metric-entries"] });
  qc.invalidateQueries({ queryKey: ["metric-summary"] });
  qc.invalidateQueries({ queryKey: ["metrics"] });
}

export function useUpsertEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BulkEntryRow) => {
      const { data } = await api.post<ResourceItem<Entry>>("/entries", input);
      return data.data;
    },
    onSuccess: () => invalidateEntries(qc),
  });
}

export function useBulkUpsertEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: BulkEntryRow[]) => {
      const { data } = await api.post<ResourceCollection<Entry>>("/entries/bulk", { entries });
      return data.data;
    },
    onSuccess: () => invalidateEntries(qc),
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number;
      input: { value?: EntryValue; logged_date?: string; notes?: string | null };
    }) => {
      const { data } = await api.patch<ResourceItem<Entry>>(`/entries/${id}`, input);
      return data.data;
    },
    onSuccess: () => invalidateEntries(qc),
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/entries/${id}`);
    },
    onSuccess: () => invalidateEntries(qc),
  });
}
