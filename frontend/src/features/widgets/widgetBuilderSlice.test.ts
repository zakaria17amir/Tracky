import { describe, expect, it } from "vitest";
import reducer, {
  back,
  chooseChart,
  closeBuilder,
  initialState,
  openBuilder,
  selectMetric,
  setConfigField,
  setSearch,
} from "./widgetBuilderSlice";
import { defaultConfig } from "../../lib/widgetData";
import type { Widget } from "../../types";

const widget: Widget = {
  id: 4,
  dashboard_id: 1,
  metric_id: 7,
  chart_type: "line",
  position: 0,
  config: { range_days: 30, color: "#22c55e" },
};

describe("widgetBuilderSlice", () => {
  it("opens empty on step 1 for a new widget", () => {
    const state = reducer(initialState, openBuilder());
    expect(state).toMatchObject({ open: true, step: 1, metricId: null, chartType: null, editingWidget: null });
  });

  it("opens on step 2 prefilled from the widget being edited", () => {
    const state = reducer(initialState, openBuilder(widget));
    expect(state).toMatchObject({
      open: true,
      step: 2,
      metricId: 7,
      chartType: "line",
      config: { range_days: 30, color: "#22c55e" },
      editingWidget: widget,
    });
  });

  it("selecting a metric moves to step 2", () => {
    const state = reducer(reducer(initialState, openBuilder()), selectMetric(3));
    expect(state).toMatchObject({ metricId: 3, step: 2 });
  });

  it("choosing a chart resets config to that chart's defaults and moves to step 3", () => {
    const edited = reducer(initialState, openBuilder(widget));
    const state = reducer(edited, chooseChart("bar"));
    expect(state.chartType).toBe("bar");
    expect(state.config).toEqual(defaultConfig("bar"));
    expect(state.step).toBe(3);
  });

  it("sets a single config field", () => {
    const state = reducer(reducer(initialState, chooseChart("line")), setConfigField({ key: "range_days", value: 90 }));
    expect(state.config.range_days).toBe(90);
    expect(state.config.show_points).toBe(true);
  });

  it("back never goes below step 1", () => {
    expect(reducer(initialState, back()).step).toBe(1);
    expect(reducer({ ...initialState, step: 3 }, back()).step).toBe(2);
  });

  it("stores the metric search text", () => {
    expect(reducer(initialState, setSearch("sle")).search).toBe("sle");
  });

  it("closing returns to the initial state", () => {
    const dirty = reducer(reducer(initialState, openBuilder(widget)), setSearch("x"));
    expect(reducer(dirty, closeBuilder())).toEqual(initialState);
  });
});
