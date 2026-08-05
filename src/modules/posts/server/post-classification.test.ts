import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { assertValidPostClassification } from "./post-classification";

type ClassificationClient = Parameters<typeof assertValidPostClassification>[0];

function createClient({
  category = null,
  column = null,
  technicalColumns = [],
}: {
  category?: { id: string; name: string; type: string; isActive: boolean } | null;
  column?: { id: string; title: string; type: string; isActive: boolean } | null;
  technicalColumns?: Array<{
    id: string;
    title: string;
    type: string;
    categoryId: string | null;
    isActive: boolean;
  }>;
}): ClassificationClient {
  return {
    category: { findUnique: vi.fn().mockResolvedValue(category) },
    column: {
      findUnique: vi.fn().mockResolvedValue(column),
      findMany: vi.fn().mockResolvedValue(technicalColumns),
    },
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
    ).resolves.toEqual({ technicalColumnIds: [], newsColumnIds: [] });
  });

  it("accepts ordinary news and legacy column categories", async () => {
    await expect(
      assertValidPostClassification(createClient({}), {
        kind: "NEWS",
        categoryId: null,
        columnId: null,
      })
    ).resolves.toEqual({ technicalColumnIds: [], newsColumnIds: [] });

    const legacyClient = createClient({
      category: { id: "legacy", name: "Legacy", type: "COLUMN", isActive: true },
    });
    await expect(
      assertValidPostClassification(legacyClient, {
        kind: "NEWS",
        categoryId: "legacy",
        columnId: null,
      })
    ).resolves.toEqual({ technicalColumnIds: [], newsColumnIds: [] });
  });

  it("allows standalone daily posts and validates optional daily columns", async () => {
    await expect(
      assertValidPostClassification(createClient({}), {
        kind: "DAILY",
        categoryId: null,
        columnId: null,
      })
    ).resolves.toEqual({ technicalColumnIds: [], newsColumnIds: [] });

    const client = createClient({
      column: { id: "daily", title: "Daily", type: "DAILY", isActive: true },
    });
    await expect(
      assertValidPostClassification(client, {
        kind: "DAILY",
        categoryId: null,
        columnId: "daily",
      })
    ).resolves.toEqual({ technicalColumnIds: [], newsColumnIds: [] });

    const newsColumnClient = createClient({
      column: { id: "news", title: "News", type: "NEWS", isActive: true },
    });
    await expect(
      assertValidPostClassification(newsColumnClient, {
        kind: "DAILY",
        categoryId: null,
        columnId: "news",
      })
    ).rejects.toMatchObject({ status: 400, code: "BAD_REQUEST" });
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
    ).resolves.toEqual({ technicalColumnIds: [], newsColumnIds: [] });
  });

  it("accepts multiple technical columns from the selected category", async () => {
    const client = createClient({
      category: { id: "competition", name: "Competition", type: "COMPETITION", isActive: true },
      technicalColumns: [
        {
          id: "guide",
          title: "Guide",
          type: "TECHNICAL",
          categoryId: "competition",
          isActive: true,
        },
        {
          id: "review",
          title: "Review",
          type: "TECHNICAL",
          categoryId: "competition",
          isActive: true,
        },
      ],
    });

    await expect(
      assertValidPostClassification(client, {
        kind: "TECHNICAL",
        categoryId: "competition",
        columnId: null,
        technicalColumnIds: ["guide", "review"],
      })
    ).resolves.toEqual({
      technicalColumnIds: ["guide", "review"],
      newsColumnIds: [],
    });
  });

  it("removes old technical columns when the article changes category", async () => {
    const client = createClient({
      category: { id: "knowledge", name: "Knowledge", type: "KNOWLEDGE", isActive: true },
      technicalColumns: [
        {
          id: "old-column",
          title: "Old",
          type: "TECHNICAL",
          categoryId: "competition",
          isActive: true,
        },
      ],
    });

    await expect(
      assertValidPostClassification(
        client,
        {
          kind: "TECHNICAL",
          categoryId: "knowledge",
          columnId: null,
          technicalColumnIds: ["old-column"],
        },
        {
          categoryId: "competition",
          columnId: null,
          technicalColumnIds: ["old-column"],
        }
      )
    ).resolves.toEqual({ technicalColumnIds: [], newsColumnIds: [] });
  });

  it("accepts multiple news columns for ordinary news", async () => {
    const client = createClient({
      technicalColumns: [
        {
          id: "dispatches",
          title: "Dispatches",
          type: "NEWS",
          categoryId: null,
          isActive: true,
        },
        {
          id: "awards",
          title: "Awards",
          type: "NEWS",
          categoryId: null,
          isActive: true,
        },
      ],
    });

    await expect(
      assertValidPostClassification(client, {
        kind: "NEWS",
        categoryId: null,
        columnId: null,
        newsColumnIds: ["dispatches", "awards"],
      })
    ).resolves.toEqual({
      technicalColumnIds: [],
      newsColumnIds: ["dispatches", "awards"],
    });
  });

  it("rejects news columns for legacy event articles", async () => {
    const client = createClient({
      category: { id: "event", name: "Event", type: "EVENT", isActive: true },
      technicalColumns: [
        {
          id: "dispatches",
          title: "Dispatches",
          type: "NEWS",
          categoryId: null,
          isActive: true,
        },
      ],
    });

    await expect(
      assertValidPostClassification(client, {
        kind: "NEWS",
        categoryId: "event",
        columnId: null,
        newsColumnIds: ["dispatches"],
      })
    ).rejects.toMatchObject({ status: 400, code: "BAD_REQUEST" });
  });
});
