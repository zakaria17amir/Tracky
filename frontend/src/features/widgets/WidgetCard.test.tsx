import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import WidgetCard from "./WidgetCard";
import type { Metric, Widget } from "../../types";

const hooks = vi.hoisted(() => ({
  useMetricEntries: vi.fn(),
  useMetricSummary: vi.fn(),
}));
vi.mock("../entries", () => hooks);

const metric: Metric = {
  id: 3,
  user_id: 1,
  name: "Mood",
  description: null,
  type: "scale",
  unit: null,
  scale_min: 1,
  scale_max: 10,
  is_active: true,
};

function widget(overrides: Partial<Widget> = {}): Widget {
  return { id: 9, dashboard_id: 1, metric_id: 3, chart_type: "stat", position: 0, config: {}, metric, ...overrides };
}

function renderCard(w: Widget) {
  return render(
    <DndContext>
      <SortableContext items={[w.id]}>
        <WidgetCard widget={w} onEdit={() => {}} onDelete={() => {}} />
      </SortableContext>
    </DndContext>,
  );
}

describe("WidgetCard", () => {
  it("shows a spinner while the summary loads", () => {
    hooks.useMetricSummary.mockReturnValue({ data: undefined, isLoading: true });
    renderCard(widget());
    // dnd-kit renders its own role="status" live region, so scope to the card.
    expect(within(screen.getByTestId("widget-card")).getByRole("status")).toBeInTheDocument();
  });

  it("renders a stat card with the metric name and current value", () => {
    hooks.useMetricSummary.mockReturnValue({
      data: { current: 7, current_date: "2026-09-28", average: 6, yesterday: null, last_week: null, streak: 2 },
      isLoading: false,
    });
    renderCard(widget());
    expect(screen.getByRole("heading", { name: "Mood" })).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/1\.0 vs average/)).toBeInTheDocument();
  });

  it("shows the empty state for a line chart with no entries", () => {
    hooks.useMetricEntries.mockReturnValue({ data: [], isLoading: false });
    renderCard(widget({ chart_type: "line", config: { range_days: 14 } }));
    expect(screen.getByText(/No data yet/)).toBeInTheDocument();
  });
});
