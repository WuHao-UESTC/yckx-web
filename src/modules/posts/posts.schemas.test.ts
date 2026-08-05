import { describe, expect, it } from "vitest";
import { createPostSchema, postListQuerySchema, updatePostSchema } from "./posts.schemas";

describe("post schemas", () => {
  it("applies safe public list defaults", () => {
    expect(postListQuerySchema.parse({})).toMatchObject({
      page: 1,
      status: "PUBLISHED",
    });
  });

  it("normalizes create input", () => {
    const result = createPostSchema.parse({
      title: "  标题  ",
      content: "  正文  ",
      tags: ["  标签  "],
    });

    expect(result.title).toBe("标题");
    expect(result.content).toBe("正文");
    expect(result.tags).toEqual(["标签"]);
    expect(result.kind).toBe("TECHNICAL");
    expect(result.attachmentIds).toEqual([]);
    expect(result.technicalColumnIds).toEqual([]);
    expect(result.newsColumnIds).toEqual([]);
    expect(result.dailyColumnIds).toEqual([]);
    expect(result.renderStyle).toBe("DEFAULT");
  });

  it("rejects empty updates", () => {
    expect(() => updatePostSchema.parse({})).toThrow();
  });
});
