import { describe, expect, it } from "vitest";
import { safeWebsiteHref } from "./profile-links";

describe("safeWebsiteHref", () => {
  it("allows relative and http(s) links", () => {
    expect(safeWebsiteHref("/friends/alice")).toBe("/friends/alice");
    expect(safeWebsiteHref("https://example.com/profile")).toBe("https://example.com/profile");
    expect(safeWebsiteHref("http://example.com")).toBe("http://example.com/");
  });

  it("keeps free-form text and unsafe protocols non-clickable", () => {
    expect(safeWebsiteHref("我的主页 / portfolio")).toBeNull();
    expect(safeWebsiteHref("javascript:alert(1)")).toBeNull();
    expect(safeWebsiteHref("data:text/html,test")).toBeNull();
    expect(safeWebsiteHref(" ")).toBeNull();
  });
});
