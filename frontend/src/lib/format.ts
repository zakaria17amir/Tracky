import type { Entry, Metric } from "../types";

const TYPE_ACCENT: Record<string, string> = {
  numeric: "bg-indigo-500",
  scale: "bg-green-500",
  boolean: "bg-amber-500",
};

export function typeAccent(type: string): string {
  return TYPE_ACCENT[type] ?? "bg-gray-400";
}

/** A short label of a metric's unit / range. */
export function metricRangeLabel(metric: Metric): string {
  if (metric.type === "numeric") return metric.unit || "—";
  if (metric.type === "scale") return `${metric.scale_min}–${metric.scale_max}`;
  return "yes / no";
}

/** Human label for an entry's value, given the parent metric. */
export function formatEntryValue(value: Entry["value"], metric?: Metric): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (metric?.type === "numeric" && metric.unit) return `${value} ${metric.unit}`;
  return String(value);
}

/** Relative day label like "Today", "Yesterday", "3d ago". */
export function relativeDay(dateStr?: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export function lastEntrySummary(metric: Metric): string {
  const entry = metric.latest_entry;
  if (!entry) return "No entries yet";
  return `${formatEntryValue(entry.value, metric)} · ${relativeDay(entry.logged_date)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
