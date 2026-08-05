import { describe, expect, it } from "vitest";
import { createCategoryFormSchema, milestoneFormSchema } from "./admin.schemas";

describe("admin schemas", () => {
  it("accepts the news category type", () => {
    expect(createCategoryFormSchema.parse({ name: "科协新闻", type: "NEWS" })).toEqual({
      name: "科协新闻",
      type: "NEWS",
    });
  });

  it("normalizes a milestone date to UTC", () => {
    const result = milestoneFormSchema.parse({
      occurredAt: "2026-08-05",
      title: "新节点",
      description: "完成时间回声页面改造。",
    });

    expect(result.occurredAt.toISOString()).toBe("2026-08-05T00:00:00.000Z");
  });

  it("rejects an invalid milestone date", () => {
    expect(() =>
      milestoneFormSchema.parse({
        occurredAt: "2026/08/05",
        title: "新节点",
        description: "日期格式错误。",
      })
    ).toThrow();

    expect(() =>
      milestoneFormSchema.parse({
        occurredAt: "2026-02-30",
        title: "新节点",
        description: "不存在的日期。",
      })
    ).toThrow();
  });
});
