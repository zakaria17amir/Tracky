import { timeDay, timeMonday } from "d3-time";
import type { Point } from "../features/dashboardGraph";

export interface HeatCell {
  date: string;
  value: number | null;
  /** 0 = Monday … 6 = Sunday. */
  row: number;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The last `days` days ending `today`, as Monday-first week columns, plus the logged value range. */
export function buildHeatmap(points: Point[], days: number, today: Date) {
  const end = timeDay.floor(today);
  const start = timeDay.offset(end, -(days - 1));
  const values = new Map(points.map((p) => [p.logged_date, p.value]));

  const weeks: HeatCell[][] = [];
  const inWindow: number[] = [];
  let weekStart: number | null = null;
  for (const day of timeDay.range(start, timeDay.offset(end, 1))) {
    const date = ymd(day);
    const value = values.get(date) ?? null;
    if (value !== null) inWindow.push(value);
    const monday = +timeMonday.floor(day);
    if (monday !== weekStart) {
      weeks.push([]);
      weekStart = monday;
    }
    weeks[weeks.length - 1].push({ date, value, row: (day.getDay() + 6) % 7 });
  }

  return {
    weeks,
    min: inWindow.length ? Math.min(...inWindow) : 0,
    max: inWindow.length ? Math.max(...inWindow) : 0,
  };
}
