import { describe, expect, it } from "vitest";
import { createTideAnchor, createTideLinks } from "./knowledge-tide-graph";

const categories = Array.from({ length: 9 }, (_, index) => ({ id: `category-${index + 1}` }));

describe("knowledge tide graph", () => {
  it("creates a stable topology regardless of category order", () => {
    expect(createTideLinks([...categories].reverse())).toEqual(createTideLinks(categories));
  });

  it("keeps every category connected without creating a central hub", () => {
    const links = createTideLinks(categories);
    const connectedIds = new Set(links.flatMap((link) => [link.sourceId, link.targetId]));
    const degrees = new Map<string, number>();

    for (const link of links) {
      degrees.set(link.sourceId, (degrees.get(link.sourceId) ?? 0) + 1);
      degrees.set(link.targetId, (degrees.get(link.targetId) ?? 0) + 1);
    }

    expect(connectedIds).toEqual(new Set(categories.map((category) => category.id)));
    expect(Math.max(...degrees.values())).toBeLessThanOrEqual(4);
    expect(links).toHaveLength(categories.length + Math.floor(categories.length / 3));
  });

  it("provides stable irregular anchors inside the safe graph area", () => {
    const first = createTideAnchor("embedded-systems");
    const second = createTideAnchor("artificial-intelligence");

    expect(createTideAnchor("embedded-systems")).toEqual(first);
    expect(first).not.toEqual(second);
    expect(first.x).toBeGreaterThanOrEqual(0.2);
    expect(first.x).toBeLessThanOrEqual(0.8);
    expect(first.y).toBeGreaterThanOrEqual(0.18);
    expect(first.y).toBeLessThanOrEqual(0.82);
  });
});
