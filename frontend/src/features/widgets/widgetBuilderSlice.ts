import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { defaultConfig } from "../../lib/widgetData";
import type { ChartType, Widget, WidgetConfig } from "../../types";

/** The fields the builder needs from a widget being edited (REST or GraphQL shaped). */
export type EditableWidget = Pick<Widget, "id" | "metric_id" | "chart_type" | "config">;

/** Ephemeral UI state of the three-step widget builder. Server data stays in TanStack Query. */
export interface WidgetBuilderState {
  open: boolean;
  editingWidget: EditableWidget | null;
  step: 1 | 2 | 3;
  metricId: number | null;
  chartType: ChartType | null;
  config: WidgetConfig;
  search: string;
}

export const initialState: WidgetBuilderState = {
  open: false,
  editingWidget: null,
  step: 1,
  metricId: null,
  chartType: null,
  config: {},
  search: "",
};

const widgetBuilderSlice = createSlice({
  name: "widgetBuilder",
  initialState,
  reducers: {
    openBuilder(_state, action: PayloadAction<EditableWidget | undefined>) {
      const widget = action.payload;
      if (!widget) return { ...initialState, open: true };
      // Editing locks the metric, so start at the chart step.
      return {
        ...initialState,
        open: true,
        editingWidget: widget,
        step: 2,
        metricId: widget.metric_id,
        chartType: widget.chart_type,
        config: widget.config ?? defaultConfig(widget.chart_type),
      };
    },
    closeBuilder() {
      return initialState;
    },
    selectMetric(state, action: PayloadAction<number>) {
      state.metricId = action.payload;
      state.step = 2;
    },
    chooseChart(state, action: PayloadAction<ChartType>) {
      state.chartType = action.payload;
      state.config = defaultConfig(action.payload);
      state.step = 3;
    },
    setConfigField(state, action: PayloadAction<{ key: keyof WidgetConfig; value: WidgetConfig[keyof WidgetConfig] }>) {
      state.config[action.payload.key] = action.payload.value;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    back(state) {
      state.step = Math.max(1, state.step - 1) as 1 | 2 | 3;
    },
  },
});

export const { openBuilder, closeBuilder, selectMetric, chooseChart, setConfigField, setSearch, back } =
  widgetBuilderSlice.actions;
export default widgetBuilderSlice.reducer;
