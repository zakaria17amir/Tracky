import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { dashboardKeys } from "./dashboards";
import type { ChartType, Metric, MetricSummaryData, Widget, WidgetConfig } from "../types";

/** One day's value for a metric; booleans are 1/0. */
export interface Point {
  logged_date: string;
  value: number;
}

export type GraphMetric = Pick<Metric, "id" | "name" | "type" | "unit" | "scale_min" | "scale_max">;

export interface GraphWidget extends Pick<Widget, "id" | "dashboard_id" | "metric_id" | "chart_type" | "position" | "config"> {
  metric: GraphMetric;
  points: Point[];
  summary: MetricSummaryData;
}

export interface GraphDashboard {
  id: number;
  name: string;
  description: string | null;
  widgets: GraphWidget[];
}

// GraphQL IDs arrive as strings and booleans as 1/0 floats.
interface RawWidget {
  id: string;
  chart_type: ChartType;
  position: number;
  config: WidgetConfig | null;
  metric: Omit<GraphMetric, "id"> & { id: string };
  entries: Point[];
  summary: Omit<MetricSummaryData, "current"> & { current: number | null };
}

export interface RawDashboard {
  id: string;
  name: string;
  description: string | null;
  widgets: RawWidget[];
}

const DASHBOARD_QUERY = `
  query Dashboard($id: ID!) {
    dashboard(id: $id) {
      id
      name
      description
      widgets {
        id
        chart_type
        position
        config
        metric { id name type unit scale_min scale_max }
        entries(days: 90) { logged_date value }
        summary(threshold: 1) { current current_date average yesterday last_week streak }
      }
    }
  }
`;

export function toGraphDashboard(raw: RawDashboard): GraphDashboard {
  const id = Number(raw.id);
  return {
    id,
    name: raw.name,
    description: raw.description,
    widgets: raw.widgets.map((w) => {
      const metric = { ...w.metric, id: Number(w.metric.id) };
      const current =
        metric.type === "boolean" && w.summary.current !== null ? w.summary.current === 1 : w.summary.current;
      return {
        id: Number(w.id),
        dashboard_id: id,
        metric_id: metric.id,
        chart_type: w.chart_type,
        position: w.position,
        // PHP encodes an empty config as [], which would drop keys when edited and re-sent.
        config: w.config && !Array.isArray(w.config) ? w.config : {},
        metric,
        points: w.entries,
        summary: { ...w.summary, current },
      };
    }),
  };
}

export async function fetchDashboardGraph(id: number): Promise<GraphDashboard> {
  const { data } = await api.post<{ data?: { dashboard: RawDashboard | null }; errors?: { message: string }[] }>(
    "/graphql",
    { query: DASHBOARD_QUERY, variables: { id } },
  );
  if (data.errors?.length) throw new Error(data.errors[0].message);
  if (!data.data?.dashboard) throw new Error("Dashboard not found.");
  return toGraphDashboard(data.data.dashboard);
}

/**
 * Everything the dashboard view renders — widgets, metrics, chart points, summaries — in one
 * GraphQL request. Keyed under the dashboard so widget mutations invalidate it too.
 */
export function useDashboardGraph(id: number | undefined) {
  return useQuery({
    queryKey: [...dashboardKeys.detail(id ?? 0), "graph"],
    queryFn: () => fetchDashboardGraph(id!),
    enabled: !!id,
  });
}
