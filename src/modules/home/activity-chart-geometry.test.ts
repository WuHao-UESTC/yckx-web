import { describe, expect, it } from "vitest";
import { activityChartIndexFromClientX } from "./activity-chart-geometry";

describe("activityChartIndexFromClientX", () => {
  it("accounts for horizontal letterboxing and plot padding", () => {
    const bounds = { left: 100, width: 1000, height: 250 };

    expect(activityChartIndexFromClientX(288, bounds, 30)).toBe(0);
    expect(activityChartIndexFromClientX(615, bounds, 30)).toBe(15);
    expect(activityChartIndexFromClientX(942, bounds, 30)).toBe(29);
  });

  it("clamps pointers outside the plot to the first or last point", () => {
    const bounds = { left: 20, width: 720, height: 250 };

    expect(activityChartIndexFromClientX(20, bounds, 7)).toBe(0);
    expect(activityChartIndexFromClientX(740, bounds, 7)).toBe(6);
  });
});
