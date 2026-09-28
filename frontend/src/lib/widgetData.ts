import type { WidgetConfig } from "../types";

export interface ChartPoint {
  date: string;
  label: string;
  value: number;
}

/** {logged_date,value} points → ascending {date,label,value} within an optional day window. */
export function pointsToSeries(points: { logged_date: string; value: number }[], rangeDays?: number): ChartPoint[] {
  let rows = [...points].sort((a, b) => a.logged_date.localeCompare(b.logged_date));
  if (rangeDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays);
    rows = rows.filter((p) => new Date(p.logged_date + "T00:00:00") >= cutoff);
  }
  return rows.map((p) => ({
    date: p.logged_date,
    label: new Date(p.logged_date + "T00:00:00").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    value: p.value,
  }));
}

export const CHART_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

/** Default config for a freshly-selected chart type. */
export function defaultConfig(chartType: string): WidgetConfig {
  switch (chartType) {
    case "line":
      return { range_days: 14, show_points: true, color: CHART_COLORS[0] };
    case "bar":
      return { grouping: "daily", color: CHART_COLORS[1] };
    case "stat":
      return { comparison: "average" };
    case "streak":
      return { threshold_type: "boolean", threshold_value: 1 };
    case "heatmap":
      return { range_days: 90, color: CHART_COLORS[0] };
    default:
      return {};
  }
}
