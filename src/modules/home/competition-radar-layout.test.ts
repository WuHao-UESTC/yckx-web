import { describe, expect, it } from "vitest";
import { createRadarTargetLayouts } from "./competition-radar-layout";

const categories = Array.from({ length: 8 }, (_, index) => ({ id: `competition-${index + 1}` }));

describe("competition radar layout", () => {
  it("keeps target placement stable when category order changes", () => {
    expect(createRadarTargetLayouts([...categories].reverse())).toEqual(
      createRadarTargetLayouts(categories)
    );
  });

  it("limits the radar to seven separated targets", () => {
    const targets = createRadarTargetLayouts(categories);
    expect(targets).toHaveLength(7);

    for (let firstIndex = 0; firstIndex < targets.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < targets.length; secondIndex += 1) {
        const first = targets[firstIndex];
        const second = targets[secondIndex];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        expect(distance).toBeGreaterThanOrEqual(24);
      }
    }
  });

  it("aligns every target with a ten-second sonar sweep", () => {
    for (const target of createRadarTargetLayouts(categories)) {
      expect(target.angle).toBeGreaterThanOrEqual(0);
      expect(target.angle).toBeLessThan(360);
      expect(target.bearing).toBeGreaterThanOrEqual(0);
      expect(target.bearing).toBeLessThan(360);
      expect(target.bearing).toBeCloseTo((target.angle + 90) % 360);
      expect(target.distance).toBeGreaterThan(0);
      expect(target.distance).toBeLessThan(50);
      expect(target.scanDelay).toBeCloseTo((target.angle / 360) * 10);
    }
  });
});
