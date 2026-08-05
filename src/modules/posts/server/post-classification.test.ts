import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { assertValidPostClassification } from "./post-classification";

type ClassificationClient = Parameters<typeof assertValidPostClassification>[0];

function createClient({
  category = null,
  column = null,
}: {
  category?: { id: string; name: string; type: string; isActive: boolean } | null;
  column?: { id: string; title: string; type: string; isActive: boolean } | null;
}): ClassificationClient {
  return {
    category: { findUnique: vi.fn().mockResolvedValue(category) },
    column: { findUnique: vi.fn().mockResolvedValue(column) },
  } as unknown as ClassificationClient;
}

describe("post classification", () => {
  it("accepts technical posts in knowledge or competition categories", async () => {
    const client = createClient({
      category: { id: "knowledge", name: "Knowledge", type: "KNOWLEDGE", isActive: true },
    });

    await expect(
      assertValidPostClassification(client, {
        kind: "TECHNICAL",
        categoryId: "knowledge",
        columnId: null,
      })
    ).resolves.toBeUndefined();
  });

  it("accepts ordinary news and legacy column categories", async () => {
    await expect(
      assertValidPostClassification(createClient({}), {
        kind: "NEWS",
        categoryId: null,
        columnId: null,
      })
    ).resolves.toBeUndefined();

    const legacyClient = createClient({
      category: { id: "legacy", name: "Legacy", type: "COLUMN", isActive: true },
    });
    await expect(
      assertValidPostClassification(legacyClient, {
        kind: "NEWS",
        categoryId: "legacy",
        columnId: null,
      })
    ).resolves.toBeUndefined();
  });

  it("requires daily posts to use a daily column", async () => {
    await expect(
      assertValidPostClassification(createClient({}), {
        kind: "DAILY",
        categoryId: null,
        columnId: null,
      })
    ).rejects.toMatchObject({ status: 400, code: "BAD_REQUEST" });

    const client = createClient({
      column: { id: "daily", title: "Daily", type: "DAILY", isActive: true },
    });
    await expect(
      assertValidPostClassification(client, {
        kind: "DAILY",
        categoryId: null,
        columnId: "daily",
      })
    ).resolves.toBeUndefined();
  });

  it("allows an existing post to retain a disabled taxonomy but blocks new use", async () => {
    const client = createClient({
      category: { id: "disabled", name: "Disabled", type: "KNOWLEDGE", isActive: false },
    });
    const classification = {
      kind: "TECHNICAL" as const,
      categoryId: "disabled",
      columnId: null,
    };

    await expect(assertValidPostClassification(client, classification)).rejects.toMatchObject({
      status: 400,
      code: "BAD_REQUEST",
    });
    await expect(
      assertValidPostClassification(client, classification, {
        categoryId: "disabled",
        columnId: null,
      })
    ).resolves.toBeUndefined();
  });
});
