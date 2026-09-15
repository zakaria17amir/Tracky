import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { dashboardKeys } from "./dashboards";
import type { ChartType, ResourceItem, Widget, WidgetConfig } from "../types";

export interface WidgetInput {
  metric_id: number;
  chart_type: ChartType;
  config?: WidgetConfig;
}

export function useCreateWidget(dashboardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: WidgetInput) => {
      const { data } = await api.post<ResourceItem<Widget>>(
        `/dashboards/${dashboardId}/widgets`,
        input,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: dashboardKeys.detail(dashboardId) }),
  });
}

export function useUpdateWidget(dashboardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number;
      input: { chart_type?: ChartType; config?: WidgetConfig };
    }) => {
      const { data } = await api.patch<ResourceItem<Widget>>(`/widgets/${id}`, input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: dashboardKeys.detail(dashboardId) }),
  });
}

export function useDeleteWidget(dashboardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/widgets/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: dashboardKeys.detail(dashboardId) }),
  });
}

export function useReorderWidgets(dashboardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (widgetIds: number[]) => {
      await api.patch(`/dashboards/${dashboardId}/widgets/reorder`, { widget_ids: widgetIds });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: dashboardKeys.detail(dashboardId) }),
  });
}
