import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  Entry,
  EntryValue,
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

function invalidateEntries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: entryKeys.all });
  qc.invalidateQueries({ queryKey: ["metrics"] });
  // Dashboard views embed entries and summaries through GraphQL.
  qc.invalidateQueries({ queryKey: ["dashboards"] });
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
