import { describe, expect, it } from "vitest";
import { buildActivitySeries, buildSectionStats } from "./home-activity";

describe("home activity", () => {
  it("groups published posts by Shanghai calendar day and month", () => {
    const series = buildActivitySeries(
      [
        new Date("2026-08-04T16:30:00.000Z"),
        new Date("2026-08-04T18:00:00.000Z"),
        new Date("2026-08-04T15:59:00.000Z"),
        new Date("2026-07-12T03:00:00.000Z"),
      ],
      new Date("2026-08-05T04:00:00.000Z")
    );

    expect(series.week).toHaveLength(7);
    expect(series.month).toHaveLength(30);
    expect(series.year).toHaveLength(12);
    expect(series.week.at(-1)).toMatchObject({ key: "2026-08-05", count: 2 });
    expect(series.week.at(-2)).toMatchObject({ key: "2026-08-04", count: 1 });
    expect(series.year.at(-1)).toMatchObject({ key: "2026-08", count: 3 });
    expect(series.year.at(-2)).toMatchObject({ key: "2026-07", count: 1 });
  });

  it("keeps every public section visible even when it is empty", () => {
    const sections = buildSectionStats([
      { type: "KNOWLEDGE", posts: 4 },
      { type: "KNOWLEDGE", posts: 2 },
      { type: "NEWS", posts: 3 },
    ]);

    expect(sections).toHaveLength(6);
    expect(sections[0]).toMatchObject({ label: "知识库", categories: 2, posts: 6 });
    expect(sections[2]).toMatchObject({ label: "科协新闻", categories: 1, posts: 3 });
    expect(sections[1]).toMatchObject({ label: "竞赛中心", categories: 0, posts: 0 });
  });
});
