import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import WidgetConfigurator from "./WidgetConfigurator";
import { openBuilder } from "./widgetBuilderSlice";
import { makeStore } from "../../store";
import type { Metric } from "../../types";

function metric(id: number, name: string, type: Metric["type"]): Metric {
  return { id, user_id: 1, name, description: null, type, unit: null, scale_min: null, scale_max: null, is_active: true };
}

vi.mock("../metrics", () => ({
  useMetrics: () => ({ data: [metric(1, "Sleep", "numeric"), metric(2, "Exercised", "boolean")] }),
}));
vi.mock("../widgets", () => ({
  useCreateWidget: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateWidget: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("../../context/ToastContext", () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

describe("WidgetConfigurator", () => {
  it("offers only stat and streak for a boolean metric, and back returns to the metric list", async () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <WidgetConfigurator dashboardId={1} />
      </Provider>,
    );
    act(() => void store.dispatch(openBuilder()));
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /Exercised/ }));

    expect(screen.getByRole("button", { name: /Stat Card/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Streak/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Line Chart/ })).not.toBeInTheDocument();
    expect(store.getState().widgetBuilder).toMatchObject({ step: 2, metricId: 2 });

    await user.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByRole("button", { name: /Sleep/ })).toBeInTheDocument();
    expect(store.getState().widgetBuilder.step).toBe(1);
  });
});
