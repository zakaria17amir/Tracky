import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultConfig, numericValue, toChartSeries } from "./widgetData";
import type { Entry } from "../types";

function entry(overrides: Partial<Entry>): Entry {
  return {
    id: 1,
    metric_id: 1,
    user_id: 1,
    logged_date: "2026-09-28",
    value_numeric: null,
    value_scale: null,
    value_boolean: null,
    value: null,
    notes: null,
    ...overrides,
  };
}

describe("numericValue", () => {
  it("maps booleans to 1 and 0", () => {
    expect(numericValue(entry({ value_boolean: true }))).toBe(1);
    expect(numericValue(entry({ value_boolean: false }))).toBe(0);
  });

  it("reads scale and numeric columns", () => {
    expect(numericValue(entry({ value_scale: 7 }))).toBe(7);
    expect(numericValue(entry({ value_numeric: "7.5" }))).toBe(7.5);
  });

  it("falls back to 0 when every value column is empty", () => {
    expect(numericValue(entry({}))).toBe(0);
  });
});

describe("toChartSeries", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-28T12:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("sorts points by date ascending", () => {
    const series = toChartSeries([
      entry({ logged_date: "2026-09-27", value_numeric: 2 }),
      entry({ logged_date: "2026-09-25", value_numeric: 1 }),
    ]);
    expect(series.map((p) => p.date)).toEqual(["2026-09-25", "2026-09-27"]);
    expect(series.map((p) => p.value)).toEqual([1, 2]);
  });

  it("drops entries outside the day window", () => {
    const series = toChartSeries(
      [
        entry({ logged_date: "2026-09-18", value_numeric: 1 }),
        entry({ logged_date: "2026-09-26", value_numeric: 2 }),
      ],
      7,
    );
    expect(series.map((p) => p.date)).toEqual(["2026-09-26"]);
  });
});

describe("defaultConfig", () => {
  it("returns line chart defaults", () => {
    expect(defaultConfig("line")).toEqual({ range_days: 14, show_points: true, color: "#6366f1" });
  });

  it("returns an empty config for unknown chart types", () => {
    expect(defaultConfig("pie")).toEqual({});
  });
});
