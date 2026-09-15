import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Entry, Metric, MetricSummaryData, WidgetConfig } from "../../types";
import { CHART_COLORS, toChartSeries } from "../../lib/widgetData";

interface ChartProps {
  entries: Entry[];
  metric: Metric;
  config: WidgetConfig;
}

interface SummaryProps {
  summary: MetricSummaryData;
  metric: Metric;
  config: WidgetConfig;
}

function NoData() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-gray-400">
      No data yet — log some entries.
    </div>
  );
}

export function LineWidget({ entries, metric, config }: ChartProps) {
  const data = toChartSeries(entries, config.range_days);
  if (data.length === 0) return <NoData />;
  const color = config.color ?? CHART_COLORS[0];
  return (
    <div role="img" aria-label={`Line chart of ${metric.name} over time`}>
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={config.show_points ? { r: 3 } : false}
        />
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}

export function BarWidget({ entries, metric, config }: ChartProps) {
  const data = toChartSeries(entries, config.range_days ?? 14);
  if (data.length === 0) return <NoData />;
  const color = config.color ?? CHART_COLORS[1];
  return (
    <div role="img" aria-label={`Bar chart of ${metric.name}`}>
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}

export function StatWidget({ summary, metric, config }: SummaryProps) {
  const current = summary.current;
  if (current === null) return <NoData />;

  const mode = config.comparison ?? "average";
  const baseline =
    mode === "yesterday" ? summary.yesterday : mode === "last_week" ? summary.last_week : summary.average;
  const comparisonLabel =
    mode === "yesterday" ? "vs yesterday" : mode === "last_week" ? "vs last week" : "vs average";

  const numericCurrent = typeof current === "boolean" ? (current ? 1 : 0) : current;
  const delta = baseline !== null ? numericCurrent - baseline : null;

  const display =
    metric.type === "boolean"
      ? current
        ? "Yes"
        : "No"
      : numericCurrent.toLocaleString();
  const unit = metric.type === "numeric" && metric.unit ? ` ${metric.unit}` : "";

  return (
    <div className="flex h-40 flex-col items-center justify-center">
      <p className="text-4xl font-bold text-gray-900">
        {display}
        <span className="text-lg font-normal text-gray-400">{unit}</span>
      </p>
      {delta !== null && metric.type !== "boolean" && (
        <p
          className={`mt-2 text-sm font-medium ${
            delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-500"
          }`}
        >
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "■"} {Math.abs(delta).toFixed(1)} {comparisonLabel}
        </p>
      )}
    </div>
  );
}

export function StreakWidget({ summary }: SummaryProps) {
  const streak = summary.streak;
  return (
    <div className="flex h-40 flex-col items-center justify-center">
      <p className="text-4xl font-bold text-amber-500">🔥 {streak}</p>
      <p className="mt-2 text-sm text-gray-500">{streak === 1 ? "day" : "days"} in a row</p>
    </div>
  );
}

/** Dispatcher for entry-driven charts (line/bar). Stat/streak use summaries. */
export function EntryChart(props: ChartProps & { chartType: string }) {
  switch (props.chartType) {
    case "line":
      return <LineWidget {...props} />;
    case "bar":
      return <BarWidget {...props} />;
    default:
      return <NoData />;
  }
}
