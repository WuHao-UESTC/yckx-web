import { describe, expect, it } from "vitest";
import {
  COMPETITION_CONSTELLATIONS,
  selectCompetitionConstellation,
} from "./competition-constellations";

describe("competition constellations", () => {
  it("provides all twelve zodiac templates", () => {
    expect(COMPETITION_CONSTELLATIONS).toHaveLength(12);
    expect(new Set(COMPETITION_CONSTELLATIONS.map((template) => template.id)).size).toBe(12);
  });

  it("keeps stars, edges and article anchors inside each template", () => {
    for (const template of COMPETITION_CONSTELLATIONS) {
      expect(template.stars.length).toBeGreaterThanOrEqual(8);
      expect(template.stars.length).toBeLessThanOrEqual(14);
      expect(template.articleAnchors).toHaveLength(7);
      expect(new Set(template.articleAnchors.map((anchor) => anchor.starIndex)).size).toBe(7);

      for (const star of template.stars) {
        expect(star.x).toBeGreaterThanOrEqual(7);
        expect(star.x).toBeLessThanOrEqual(93);
        expect(star.y).toBeGreaterThanOrEqual(17);
        expect(star.y).toBeLessThanOrEqual(83);
      }
      for (const [sourceIndex, targetIndex] of template.edges) {
        expect(template.stars[sourceIndex]).toBeDefined();
        expect(template.stars[targetIndex]).toBeDefined();
      }
      for (const anchor of template.articleAnchors) {
        expect(template.stars[anchor.starIndex]).toBeDefined();
      }
    }
  });

  it("selects templates deterministically from a signal key", () => {
    expect(selectCompetitionConstellation("category:electronic-design")).toBe(
      selectCompetitionConstellation("category:electronic-design")
    );
  });
});
