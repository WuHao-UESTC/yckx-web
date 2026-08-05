import { describe, expect, it } from "vitest";
import { createUrlSlug } from "./url-slug";

describe("createUrlSlug", () => {
  it("creates a stable ASCII slug", () => {
    expect(createUrlSlug("Hello, World! 2026")).toBe("hello-world-2026");
  });

  it("creates a fallback for non-ASCII titles", () => {
    expect(createUrlSlug("纯中文标题")).toMatch(/^post-[a-z0-9]+$/);
  });
});
