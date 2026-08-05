import { describe, expect, it } from "vitest";
import {
  createCompetitionConstellationLabelLayouts,
  projectCompetitionConstellationStar,
} from "./competition-constellation-layout";
import { COMPETITION_CONSTELLATIONS } from "./competition-constellations";

describe("competition constellation label layout", () => {
  it("projects the constellation into a central plotting band", () => {
    expect(projectCompetitionConstellationStar({ x: 0, y: 0 })).toEqual({ x: 29, y: 6 });
    expect(projectCompetitionConstellationStar({ x: 100, y: 100 })).toEqual({ x: 71, y: 94 });
  });

  it("balances seven article labels across collision-free rails", () => {
    for (const constellation of COMPETITION_CONSTELLATIONS) {
      const layouts = createCompetitionConstellationLabelLayouts(constellation, 7);
      expect(layouts).toHaveLength(7);
      expect(layouts.map((layout) => layout.articleIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);

      for (const side of ["left", "right"] as const) {
        const sideLayouts = layouts
          .filter((layout) => layout.side === side)
          .sort((first, second) => first.labelY - second.labelY);
        expect(sideLayouts.length).toBeLessThanOrEqual(4);
        for (let index = 0; index < sideLayouts.length; index += 1) {
          expect(sideLayouts[index].labelY).toBeGreaterThanOrEqual(11);
          expect(sideLayouts[index].labelY).toBeLessThanOrEqual(89);
          if (index > 0) {
            expect(
              sideLayouts[index].labelY - sideLayouts[index - 1].labelY
            ).toBeGreaterThanOrEqual(22.999);
          }
        }
      }
    }
  });

  it("uses only the requested number of article anchors", () => {
    const constellation = COMPETITION_CONSTELLATIONS[0];
    expect(createCompetitionConstellationLabelLayouts(constellation, 3)).toHaveLength(3);
    expect(createCompetitionConstellationLabelLayouts(constellation, 0)).toEqual([]);
  });
});
