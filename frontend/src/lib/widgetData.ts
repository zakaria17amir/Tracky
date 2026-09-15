import type { Entry, WidgetConfig } from "../types";

/** Numeric value of an entry for charting (booleans → 1/0). */
export function numericValue(entry: Entry): number {
  if (entry.value_boolean !== null) return entry.value_boolean ? 1 : 0;
  if (entry.value_scale !== null) return entry.value_scale;
  if (entry.value_numeric !== null) return Number(entry.value_numeric);
  return 0;
}

export interface ChartPoint {
  date: string;
  label: string;
  value: number;
}

/** Entries → ascending {date,label,value} points within an optional day window. */
export function toChartSeries(entries: Entry[], rangeDays?: number): ChartPoint[] {
  let rows = [...entries].sort((a, b) => a.logged_date.localeCompare(b.logged_date));
  if (rangeDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays);
    rows = rows.filter((e) => new Date(e.logged_date + "T00:00:00") >= cutoff);
  }
  return rows.map((e) => ({
    date: e.logged_date,
    label: new Date(e.logged_date + "T00:00:00").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    value: numericValue(e),
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
    default:
      return {};
  }
}
