import { describe, expect, it } from "vitest";
import { postUrl } from "./post-url";

describe("postUrl", () => {
  it.each([
    ["NEWS", "news", "/archive/news/weekly-update"],
    ["EVENT", "events", "/archive/events/anniversary"],
    ["COMPETITION", "robotics", "/competition/robotics/contest-notes"],
    ["KNOWLEDGE", "embedded", "/knowledge-base/embedded/serial-guide"],
  ])("routes %s posts to the expected section", (type, categorySlug, expected) => {
    const slug = expected.split("/").at(-1) ?? "";

    expect(postUrl({ slug, category: { slug: categorySlug, type } })).toBe(expected);
  });
});
