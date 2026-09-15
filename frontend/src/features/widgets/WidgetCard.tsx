import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Spinner } from "flowbite-react";
import { EntryChart, StatWidget, StreakWidget } from "./WidgetCharts";
import { useMetricEntries, useMetricSummary } from "../entries";
import type { Widget } from "../../types";

interface WidgetCardProps {
  widget: Widget;
  onEdit: (widget: Widget) => void;
  onDelete: (widget: Widget) => void;
}

const CHART_LABEL: Record<string, string> = {
  line: "Line chart",
  bar: "Bar chart",
  stat: "Stat card",
  streak: "Streak",
};

export default function WidgetCard({ widget, onEdit, onDelete }: WidgetCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const metric = widget.metric;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      data-testid="widget-card"
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{metric?.name ?? "Metric"}</h3>
          <p className="text-xs text-gray-400">{CHART_LABEL[widget.chart_type]}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 active:cursor-grabbing"
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            ⠿
          </button>
          <button
            type="button"
            onClick={() => onEdit(widget)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Edit widget"
            title="Edit"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={() => onDelete(widget)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Remove widget"
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>

      {!metric ? (
        <Loading />
      ) : widget.chart_type === "stat" || widget.chart_type === "streak" ? (
        <SummaryBody widget={widget} />
      ) : (
        <EntryBody widget={widget} />
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex h-40 items-center justify-center">
      <Spinner />
    </div>
  );
}

function EntryBody({ widget }: { widget: Widget }) {
  const { data: entries, isLoading } = useMetricEntries(widget.metric_id);
  if (isLoading) return <Loading />;
  return (
    <EntryChart
      chartType={widget.chart_type}
      entries={entries ?? []}
      metric={widget.metric!}
      config={widget.config}
    />
  );
}

function SummaryBody({ widget }: { widget: Widget }) {
  const threshold = widget.config.threshold_value ?? 1;
  const { data: summary, isLoading } = useMetricSummary(widget.metric_id, threshold);
  if (isLoading || !summary) return <Loading />;

  return widget.chart_type === "streak" ? (
    <StreakWidget summary={summary} metric={widget.metric!} config={widget.config} />
  ) : (
    <StatWidget summary={summary} metric={widget.metric!} config={widget.config} />
  );
}
