import { describe, expect, it } from "vitest";
import { competitionRadarQuerySchema, graphPostsQuerySchema } from "./home.schemas";

describe("home schemas", () => {
  it("defaults knowledge graph batches to five posts", () => {
    expect(graphPostsQuerySchema.parse({ slug: "embedded-systems" })).toEqual({
      slug: "embedded-systems",
      limit: 5,
    });
  });

  it("rejects batches larger than five posts", () => {
    expect(() => graphPostsQuerySchema.parse({ slug: "embedded-systems", limit: "6" })).toThrow();
  });

  it("accepts a stable cuid cursor", () => {
    expect(
      graphPostsQuerySchema.parse({
        slug: "embedded-systems",
        cursor: "clx1234560000abcdefghijk",
      }).cursor
    ).toBe("clx1234560000abcdefghijk");
  });

  it("defaults competition radar batches to seven posts", () => {
    expect(competitionRadarQuerySchema.parse({})).toEqual({ limit: 7 });
  });

  it("accepts a competition category and rejects oversized radar batches", () => {
    expect(competitionRadarQuerySchema.parse({ slug: "electronic-design" })).toEqual({
      slug: "electronic-design",
      limit: 7,
    });
    expect(() => competitionRadarQuerySchema.parse({ limit: "8" })).toThrow();
  });
});
