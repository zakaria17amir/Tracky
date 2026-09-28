import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { Provider } from "react-redux";
import WidgetCard from "./WidgetCard";
import { makeStore } from "../../store";
import type { GraphWidget } from "../dashboardGraph";

function widget(overrides: Partial<GraphWidget> = {}): GraphWidget {
  return {
    id: 9,
    dashboard_id: 1,
    metric_id: 3,
    chart_type: "stat",
    position: 0,
    config: {},
    metric: { id: 3, name: "Mood", type: "scale", unit: null, scale_min: 1, scale_max: 10 },
    points: [],
    summary: { current: 7, current_date: "2026-09-28", average: 6, yesterday: null, last_week: null, streak: 2 },
    ...overrides,
  };
}

function renderCard(w: GraphWidget) {
  const store = makeStore();
  render(
    <Provider store={store}>
      <DndContext>
        <SortableContext items={[w.id]}>
          <WidgetCard widget={w} onDelete={() => {}} />
        </SortableContext>
      </DndContext>
    </Provider>,
  );
  return store;
}

describe("WidgetCard", () => {
  it("renders a stat card with the metric name, current value and comparison", () => {
    renderCard(widget());
    expect(screen.getByRole("heading", { name: "Mood" })).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/1\.0 vs average/)).toBeInTheDocument();
  });

  it("renders the streak from the embedded summary", () => {
    renderCard(widget({ chart_type: "streak" }));
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/days in a row/)).toBeInTheDocument();
  });

  it("shows the empty state for a line chart with no points", () => {
    renderCard(widget({ chart_type: "line", config: { range_days: 14 } }));
    expect(screen.getByText(/No data yet/)).toBeInTheDocument();
  });

  it("edit opens the builder for this widget", () => {
    const store = renderCard(widget());
    screen.getByRole("button", { name: "Edit widget" }).click();
    expect(store.getState().widgetBuilder).toMatchObject({ open: true, step: 2, metricId: 3, editingWidget: { id: 9 } });
  });
});
