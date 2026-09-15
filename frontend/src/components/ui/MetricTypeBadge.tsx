import { Badge } from "flowbite-react";
import type { MetricType } from "../../types";

const TYPE_COLORS: Record<MetricType, string> = {
  numeric: "indigo",
  scale: "green",
  boolean: "purple",
};

const TYPE_LABELS: Record<MetricType, string> = {
  numeric: "Numeric",
  scale: "Scale",
  boolean: "Boolean",
};

export default function MetricTypeBadge({ type }: { type: MetricType }) {
  return (
    <Badge color={TYPE_COLORS[type] ?? "gray"} className="inline-block w-fit">
      {TYPE_LABELS[type] ?? type}
    </Badge>
  );
}
