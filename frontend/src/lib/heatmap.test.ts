import { describe, expect, it } from "vitest";
import { buildHeatmap } from "./heatmap";

// Monday 28 Sep 2026; a 90-day window starts on Wednesday 1 Jul 2026.
const today = new Date(2026, 8, 28, 15, 30);

describe("buildHeatmap", () => {
  it("covers exactly the requested days, ending today", () => {
    const { weeks } = buildHeatmap([], 90, today);
    const cells = weeks.flat();
    expect(cells).toHaveLength(90);
    expect(cells[0].date).toBe("2026-07-01");
    expect(cells.at(-1)!.date).toBe("2026-09-28");
  });

  it("groups days into Monday-first week columns with a weekday row", () => {
    const { weeks } = buildHeatmap([], 90, today);
    expect(weeks[0][0].row).toBe(2); // Wednesday
    expect(weeks.at(-1)).toHaveLength(1); // today alone in its Monday column
    expect(weeks.at(-1)![0].row).toBe(0);
    expect(weeks.slice(1, -1).every((w) => w.length === 7)).toBe(true);
  });

  it("fills logged days, leaves missing days null and ignores points outside the window", () => {
    const { weeks } = buildHeatmap(
      [
        { logged_date: "2026-09-27", value: 4 },
        { logged_date: "2026-06-30", value: 99 },
      ],
      90,
      today,
    );
    const byDate = Object.fromEntries(weeks.flat().map((c) => [c.date, c.value]));
    expect(byDate["2026-09-27"]).toBe(4);
    expect(byDate["2026-09-26"]).toBeNull();
    expect(byDate["2026-06-30"]).toBeUndefined();
  });

  it("reports 0..0 for an empty window instead of NaN or Infinity", () => {
    const { min, max } = buildHeatmap([], 90, today);
    expect(min).toBe(0);
    expect(max).toBe(0);
  });

  it("uses the logged range for min and max, so booleans span 0..1", () => {
    const { min, max } = buildHeatmap(
      [
        { logged_date: "2026-09-20", value: 0 },
        { logged_date: "2026-09-21", value: 1 },
      ],
      90,
      today,
    );
    expect([min, max]).toEqual([0, 1]);
  });
});
