import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { comparePinyinTitles, parsePublicPostQuery, publicPostListHref } from "./public-post-list";

describe("public post list", () => {
  it("sorts Chinese titles by pinyin", () => {
    expect(["信号处理", "电子设计", "控制算法"].sort(comparePinyinTitles)).toEqual([
      "电子设计",
      "控制算法",
      "信号处理",
    ]);
  });

  it("normalizes search and sort parameters", () => {
    expect(parsePublicPostQuery({ q: "  信号  ", sort: "title", page: "2" })).toEqual({
      q: "信号",
      sort: "title",
      page: 2,
    });
  });

  it("preserves filters in pagination links", () => {
    expect(
      publicPostListHref("/competition/edc-signal", {
        q: "赛前",
        sort: "title",
        page: 3,
      })
    ).toBe("/competition/edc-signal?q=%E8%B5%9B%E5%89%8D&sort=title&page=3");
  });
});
