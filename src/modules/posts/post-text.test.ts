import { describe, expect, it } from "vitest";
import { generateExcerpt } from "./post-text";

describe("generateExcerpt", () => {
  it("removes markdown syntax and fenced code", () => {
    const excerpt = generateExcerpt(
      "# 标题\n[链接](https://example.com)\n```ts\nsecret()\n```",
      100
    );

    expect(excerpt).toBe("标题 链接");
  });

  it("truncates long content", () => {
    expect(generateExcerpt("abcdef", 3)).toBe("abc...");
  });
});
