import { scaleLinear } from "d3-scale";
import { buildHeatmap } from "../../lib/heatmap";
import { CHART_COLORS } from "../../lib/widgetData";
import type { Point } from "../dashboardGraph";
import type { Metric, WidgetConfig } from "../../types";

const CELL = 12;
const GAP = 2;
const EMPTY = "#f3f4f6";

interface HeatmapWidgetProps {
  points: Point[];
  metric: Pick<Metric, "name" | "type" | "unit">;
  config: WidgetConfig;
}

/** Calendar heatmap: one square per day, Monday-first week columns. D3 does the maths, React the SVG. */
export default function HeatmapWidget({ points, metric, config }: HeatmapWidgetProps) {
  const days = config.range_days ?? 90;
  const { weeks, min, max } = buildHeatmap(points, days, new Date());
  const color = config.color ?? CHART_COLORS[0];
  const shade = scaleLinear<string>()
    .domain(min === max ? [min - 1, max] : [min, max])
    .range(["#e0e7ff", color]);
  const unit = metric.type === "numeric" && metric.unit ? ` ${metric.unit}` : "";
  const label = (value: number) =>
    metric.type === "boolean" ? (value ? "Yes" : "No") : `${value.toLocaleString()}${unit}`;

  return (
    <div className="flex h-40 items-center justify-center overflow-x-auto">
      <svg
        role="img"
        aria-label={`Heatmap of ${metric.name} over the last ${days} days`}
        width={weeks.length * (CELL + GAP)}
        height={7 * (CELL + GAP)}
      >
        {weeks.map((week, col) =>
          week.map((cell) => (
            <rect
              key={cell.date}
              x={col * (CELL + GAP)}
              y={cell.row * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={2}
              fill={cell.value === null ? EMPTY : shade(cell.value)}
            >
              <title>{`${cell.date}: ${cell.value === null ? "no entry" : label(cell.value)}`}</title>
            </rect>
          )),
        )}
      </svg>
    </div>
  );
}
