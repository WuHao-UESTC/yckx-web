import { describe, expect, it } from "vitest";
import { createUploadedPhotoSchema } from "./photos.schemas";

describe("uploaded photo schema", () => {
  it("defaults member uploads to the ordinary photo wall", () => {
    expect(createUploadedPhotoSchema.parse({ fileId: "file-1" })).toMatchObject({
      fileId: "file-1",
      kind: "WALL",
    });
  });

  it("requires a year for group photos", () => {
    expect(() => createUploadedPhotoSchema.parse({ fileId: "file-2", kind: "GROUP" })).toThrow(
      "合照必须填写年份"
    );

    expect(
      createUploadedPhotoSchema.parse({ fileId: "file-2", kind: "GROUP", year: 2026 })
    ).toMatchObject({ kind: "GROUP", year: 2026 });
  });
});
