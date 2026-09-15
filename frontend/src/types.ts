// Shared domain types mirroring the Laravel API resources.

export type Role = "user" | "admin";
export type MetricType = "numeric" | "scale" | "boolean";
export type ChartType = "line" | "bar" | "stat" | "streak";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  metrics_count?: number;
  entries_count?: number;
  dashboards_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Metric {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  type: MetricType;
  unit: string | null;
  scale_min: number | null;
  scale_max: number | null;
  is_active: boolean;
  entries_count?: number;
  latest_entry?: Entry | null;
  created_at?: string;
  updated_at?: string;
}

export type EntryValue = number | boolean | null;

export interface Entry {
  id: number;
  metric_id: number;
  user_id: number;
  logged_date: string;
  value_numeric: string | number | null;
  value_scale: number | null;
  value_boolean: boolean | null;
  value: EntryValue;
  notes: string | null;
  metric?: Metric;
  created_at?: string;
  updated_at?: string;
}

export interface Widget {
  id: number;
  dashboard_id: number;
  metric_id: number;
  chart_type: ChartType;
  position: number;
  config: WidgetConfig;
  metric?: Metric;
  created_at?: string;
  updated_at?: string;
}

export interface WidgetConfig {
  range_days?: 7 | 14 | 30 | 90;
  show_points?: boolean;
  color?: string;
  grouping?: "daily" | "weekly" | "monthly";
  comparison?: "average" | "yesterday" | "last_week";
  threshold_type?: "boolean" | "numeric";
  threshold_value?: number;
  [key: string]: unknown;
}

export interface MetricSummaryData {
  current: number | boolean | null;
  current_date: string | null;
  average: number | null;
  yesterday: number | null;
  last_week: number | null;
  streak: number;
}

export interface Dashboard {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  widgets_count?: number;
  widgets?: Widget[];
  created_at?: string;
  updated_at?: string;
}

// Laravel paginator envelope.
export interface Paginated<T> {
  data: T[];
  links: { first: string; last: string; prev: string | null; next: string | null };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export interface ResourceCollection<T> {
  data: T[];
}

export interface ResourceItem<T> {
  data: T;
}
