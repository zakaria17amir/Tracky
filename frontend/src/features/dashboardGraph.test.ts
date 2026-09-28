import { describe, expect, it, vi } from "vitest";
import { fetchDashboardGraph, toGraphDashboard, type RawDashboard } from "./dashboardGraph";

const post = vi.hoisted(() => vi.fn());
vi.mock("../lib/api", () => ({ default: { post } }));

const raw: RawDashboard = {
  id: "5",
  name: "Health",
  description: null,
  widgets: [
    {
      id: "11",
      chart_type: "stat",
      position: 0,
      config: { comparison: "average" },
      metric: { id: "2", name: "Exercised", type: "boolean", unit: null, scale_min: null, scale_max: null },
      entries: [{ logged_date: "2026-09-27", value: 1 }],
      summary: { current: 1, current_date: "2026-09-27", average: 0.5, yesterday: 1, last_week: null, streak: 3 },
    },
    {
      id: "12",
      chart_type: "line",
      position: 1,
      config: null,
      metric: { id: "3", name: "Sleep", type: "numeric", unit: "h", scale_min: null, scale_max: null },
      entries: [],
      summary: { current: 7.5, current_date: "2026-09-27", average: 7, yesterday: null, last_week: null, streak: 1 },
    },
  ],
};

describe("toGraphDashboard", () => {
  it("turns GraphQL string ids into numbers and fills the REST widget fields", () => {
    const dashboard = toGraphDashboard(raw);
    expect(dashboard.id).toBe(5);
    expect(dashboard.widgets[0]).toMatchObject({ id: 11, dashboard_id: 5, metric_id: 2, position: 0 });
    expect(dashboard.widgets[0].metric.id).toBe(2);
  });

  it("restores boolean current values for boolean metrics only", () => {
    const [bool, numeric] = toGraphDashboard(raw).widgets;
    expect(bool.summary.current).toBe(true);
    expect(numeric.summary.current).toBe(7.5);
  });

  it("keeps points and defaults a null config to an empty object", () => {
    const [bool, numeric] = toGraphDashboard(raw).widgets;
    expect(bool.points).toEqual([{ logged_date: "2026-09-27", value: 1 }]);
    expect(numeric.config).toEqual({});
  });

  it("turns PHP's empty-array config into an object so edits survive JSON encoding", () => {
    const withArray = { ...raw, widgets: [{ ...raw.widgets[0], config: [] as unknown as null }] };
    const [widget] = toGraphDashboard(withArray).widgets;
    expect(Array.isArray(widget.config)).toBe(false);
    expect(widget.config).toEqual({});
  });
});

describe("fetchDashboardGraph", () => {
  it("posts the dashboard query with the id variable", async () => {
    post.mockResolvedValueOnce({ data: { data: { dashboard: raw } } });
    const dashboard = await fetchDashboardGraph(5);
    expect(post).toHaveBeenCalledWith("/graphql", expect.objectContaining({ variables: { id: 5 } }));
    expect(dashboard.name).toBe("Health");
  });

  it("throws the first GraphQL error message", async () => {
    post.mockResolvedValueOnce({ data: { data: { dashboard: null }, errors: [{ message: "This action is unauthorized." }] } });
    await expect(fetchDashboardGraph(5)).rejects.toThrow("This action is unauthorized.");
  });
});
