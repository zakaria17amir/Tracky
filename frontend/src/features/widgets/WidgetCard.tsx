import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EntryChart, StatWidget, StreakWidget } from "./WidgetCharts";
import HeatmapWidget from "./HeatmapWidget";
import { useAppDispatch } from "../../store";
import { openBuilder } from "./widgetBuilderSlice";
import type { GraphWidget } from "../dashboardGraph";

interface WidgetCardProps {
  widget: GraphWidget;
  onDelete: (widget: GraphWidget) => void;
}

const CHART_LABEL: Record<string, string> = {
  line: "Line chart",
  bar: "Bar chart",
  stat: "Stat card",
  streak: "Streak",
  heatmap: "Heatmap",
};

function WidgetCard({ widget, onDelete }: WidgetCardProps) {
  const dispatch = useAppDispatch();
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
          <h3 className="font-semibold text-gray-900">{metric.name}</h3>
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
            onClick={() => dispatch(openBuilder(widget))}
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

      {widget.chart_type === "stat" ? (
        <StatWidget summary={widget.summary} metric={metric} config={widget.config} />
      ) : widget.chart_type === "streak" ? (
        <StreakWidget summary={widget.summary} metric={metric} config={widget.config} />
      ) : widget.chart_type === "heatmap" ? (
        <HeatmapWidget points={widget.points} metric={metric} config={widget.config} />
      ) : (
        <EntryChart chartType={widget.chart_type} points={widget.points} metric={metric} config={widget.config} />
      )}
    </div>
  );
}

// The page re-renders for unrelated reasons (delete dialog, toasts); memo keeps every
// chart from re-rendering with it. Needs stable props and a stable SortableContext id list.
export default memo(WidgetCard);
