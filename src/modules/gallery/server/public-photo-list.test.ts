import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { parsePublicPhotoQuery, publicPhotoListHref } from "./public-photo-list";

describe("public photo list", () => {
  it("normalizes keyword, date range, and page", () => {
    const query = parsePublicPhotoQuery({
      photoQ: "  集训  ",
      photoFrom: "2026-08-02",
      photoTo: "2026-08-06",
      photoPage: "3",
    });

    expect(query).toMatchObject({ q: "集训", from: "2026-08-02", to: "2026-08-06", page: 3 });
    expect(query.createdAt.gte?.toISOString()).toBe("2026-08-01T16:00:00.000Z");
    expect(query.createdAt.lt?.toISOString()).toBe("2026-08-06T16:00:00.000Z");
  });

  it("drops invalid dates and preserves valid filters in wall links", () => {
    const query = parsePublicPhotoQuery({ photoQ: " 合影 ", photoFrom: "invalid" });
    expect(query.from).toBe("");
    expect(query.createdAt).toEqual({});
    expect(publicPhotoListHref("/routine", { ...query, page: 2 })).toBe(
      "/routine?photoQ=%E5%90%88%E5%BD%B1&photoPage=2#photo-wall"
    );
  });
});
