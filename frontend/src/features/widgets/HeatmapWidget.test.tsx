import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HeatmapWidget from "./HeatmapWidget";

const metric = { name: "Mood", type: "scale" as const, unit: null };

describe("HeatmapWidget", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 28, 12));
  });
  afterEach(() => vi.useRealTimers());

  it("draws one labelled cell per day of the window", () => {
    const { container } = render(<HeatmapWidget points={[]} metric={metric} config={{ range_days: 90 }} />);
    expect(screen.getByRole("img", { name: "Heatmap of Mood over the last 90 days" })).toBeInTheDocument();
    expect(container.querySelectorAll("rect")).toHaveLength(90);
  });

  it("greys out days without an entry and colours logged days by value", () => {
    const { container } = render(
      <HeatmapWidget
        points={[
          { logged_date: "2026-09-27", value: 2 },
          { logged_date: "2026-09-28", value: 8 },
        ]}
        metric={metric}
        config={{ range_days: 30, color: "#6366f1" }}
      />,
    );
    const fill = (date: string) =>
      [...container.querySelectorAll("rect")].find((r) => r.querySelector("title")?.textContent?.startsWith(date))!
        .getAttribute("fill");
    expect(fill("2026-09-26")).toBe("#f3f4f6");
    expect(fill("2026-09-28")).toBe("rgb(99, 102, 241)");
    expect(fill("2026-09-27")).not.toBe(fill("2026-09-28"));
  });
});
