import { describe, expect, it } from "vitest";
import { uploadedMediaMarkdown } from "./editor-media";

describe("editor media markdown", () => {
  it("creates an inline image using the protected preview route", () => {
    expect(uploadedMediaMarkdown({ id: "image-1", filename: "示意图.png" }, "image")).toBe(
      "\n![示意图.png](/api/files/image-1/preview)\n"
    );
  });

  it("escapes Markdown control characters in image names", () => {
    expect(
      uploadedMediaMarkdown({ id: "image-2", filename: "控制器 [终版]\\曲线.png" }, "image")
    ).toBe("\n![控制器 \\[终版\\]\\\\曲线.png](/api/files/image-2/preview)\n");
  });

  it("creates a PDF code block using the uploaded file preview route", () => {
    expect(uploadedMediaMarkdown({ id: "pdf-1", filename: "指导书.pdf" }, "pdf")).toBe(
      "\n```pdf\n/api/files/pdf-1/preview\n```\n"
    );
  });
});
