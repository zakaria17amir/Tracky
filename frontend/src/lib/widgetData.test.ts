import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultConfig, pointsToSeries } from "./widgetData";

describe("pointsToSeries", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-28T12:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("sorts points by date ascending", () => {
    const series = pointsToSeries([
      { logged_date: "2026-09-27", value: 2 },
      { logged_date: "2026-09-25", value: 1 },
    ]);
    expect(series.map((p) => p.date)).toEqual(["2026-09-25", "2026-09-27"]);
    expect(series.map((p) => p.value)).toEqual([1, 2]);
  });

  it("labels points and drops those outside the day window", () => {
    const series = pointsToSeries(
      [
        { logged_date: "2026-09-10", value: 3 },
        { logged_date: "2026-09-27", value: 5 },
      ],
      7,
    );
    expect(series).toEqual([{ date: "2026-09-27", label: "Sep 27", value: 5 }]);
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
