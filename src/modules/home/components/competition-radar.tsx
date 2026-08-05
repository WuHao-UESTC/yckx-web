"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronRight, RefreshCw, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRadarTargetLayouts } from "../competition-radar-layout";
import type { HomeCategory } from "../home.types";

type RadarPost = {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  categoryName: string;
  categorySlug: string;
};

type RadarBatch = {
  items: RadarPost[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

type RadarBatchState = RadarBatch & {
  status: "idle" | "loading" | "ready" | "error";
};

const EMPTY_BATCH: RadarBatchState = {
  status: "idle",
  items: [],
  nextCursor: null,
  hasMore: false,
  total: 0,
};

const CONSTELLATION_POINTS = [
  { x: 9, y: 38, label: "above-start" },
  { x: 25, y: 20, label: "above" },
  { x: 40, y: 39, label: "below" },
  { x: 52, y: 62, label: "below" },
  { x: 66, y: 50, label: "above" },
  { x: 80, y: 65, label: "below" },
  { x: 94, y: 43, label: "below-end" },
] as const;

function isRadarPost(value: unknown): value is RadarPost {
  if (!value || typeof value !== "object") return false;
  const post = value as Record<string, unknown>;
  return (
    typeof post.id === "string" &&
    typeof post.title === "string" &&
    typeof post.slug === "string" &&
    (typeof post.publishedAt === "string" || post.publishedAt === null) &&
    typeof post.categoryName === "string" &&
    typeof post.categorySlug === "string"
  );
}

function parseRadarBatch(value: unknown): RadarBatch {
  if (!value || typeof value !== "object") throw new Error("竞赛信号响应格式无效");
  const batch = value as Record<string, unknown>;
  if (
    !Array.isArray(batch.items) ||
    !batch.items.every(isRadarPost) ||
    !(typeof batch.nextCursor === "string" || batch.nextCursor === null) ||
    typeof batch.hasMore !== "boolean" ||
    typeof batch.total !== "number"
  ) {
    throw new Error("竞赛信号响应格式无效");
  }

  return {
    items: batch.items,
    nextCursor: batch.nextCursor,
    hasMore: batch.hasMore,
    total: batch.total,
  };
}

async function requestRadarBatch(
  categorySlug: string | null,
  cursor: string | null,
  signal?: AbortSignal
): Promise<RadarBatch> {
  const params = new URLSearchParams({ limit: "7" });
  if (categorySlug) params.set("slug", categorySlug);
  if (cursor) params.set("cursor", cursor);

  const response = await fetch(`/api/competition-radar?${params.toString()}`, { signal });
  if (!response.ok) throw new Error("竞赛信号读取失败");
  return parseRadarBatch(await response.json());
}

function formatRadarDate(value: string | null): string {
  if (!value) return "近期";
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(
    new Date(value)
  );
}

export function CompetitionRadar({ categories }: { categories: HomeCategory[] }) {
  const requestControllerRef = useRef<AbortController | null>(null);
  const selectedSlugRef = useRef<string | null>(null);
  const batchCacheRef = useRef(new Map<string, RadarBatch>());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [batch, setBatch] = useState<RadarBatchState>(EMPTY_BATCH);
  const [batchVersion, setBatchVersion] = useState(0);

  const targetLayouts = useMemo(() => createRadarTargetLayouts(categories), [categories]);
  const visibleCategories = useMemo(
    () =>
      targetLayouts
        .map((layout) => {
          const category = categories.find((item) => item.id === layout.id);
          return category ? { category, layout } : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [categories, targetLayouts]
  );
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedId) ?? null,
    [categories, selectedId]
  );

  const loadBatch = useCallback(async (categorySlug: string | null, cursor: string | null) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const mode = categorySlug ?? "featured";
    const cacheKey = `${mode}:${cursor ?? "first"}`;
    const cached = batchCacheRef.current.get(cacheKey);

    setBatch((current) => ({
      ...current,
      status: "loading",
      items: [],
      nextCursor: null,
      hasMore: false,
    }));

    try {
      const result = cached ?? (await requestRadarBatch(categorySlug, cursor, controller.signal));
      if (controller.signal.aborted || selectedSlugRef.current !== categorySlug) return;
      batchCacheRef.current.set(cacheKey, result);
      setBatch({ ...result, status: "ready" });
      setBatchVersion((version) => version + 1);

      if (result.hasMore && result.nextCursor) {
        const nextKey = `${mode}:${result.nextCursor}`;
        if (!batchCacheRef.current.has(nextKey)) {
          void requestRadarBatch(categorySlug, result.nextCursor)
            .then((nextResult) => batchCacheRef.current.set(nextKey, nextResult))
            .catch((error: unknown) => {
              if (process.env.NODE_ENV !== "production") {
                console.debug("Competition radar prefetch skipped", error);
              }
            });
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to load competition radar articles", error);
      }
      setBatch({ ...EMPTY_BATCH, status: "error" });
    }
  }, []);

  const showFeatured = useCallback(() => {
    selectedSlugRef.current = null;
    setSelectedId(null);
    void loadBatch(null, null);
  }, [loadBatch]);

  const selectCategory = useCallback(
    (category: HomeCategory) => {
      if (selectedId === category.id) {
        showFeatured();
        return;
      }
      selectedSlugRef.current = category.slug;
      setSelectedId(category.id);
      void loadBatch(category.slug, null);
    },
    [loadBatch, selectedId, showFeatured]
  );

  const changeBatch = useCallback(() => {
    const categorySlug = selectedCategory?.slug ?? null;
    selectedSlugRef.current = categorySlug;
    void loadBatch(categorySlug, batch.hasMore ? batch.nextCursor : null);
  }, [batch.hasMore, batch.nextCursor, loadBatch, selectedCategory]);

  useEffect(() => {
    selectedSlugRef.current = null;
    const animationFrame = window.requestAnimationFrame(() => void loadBatch(null, null));
    return () => {
      window.cancelAnimationFrame(animationFrame);
      requestControllerRef.current?.abort();
    };
  }, [loadBatch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedSlugRef.current) showFeatured();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFeatured]);

  const constellationPoints = CONSTELLATION_POINTS.slice(0, batch.items.length)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="competition-radar" data-selected={selectedCategory ? "true" : "false"}>
      <div className="competition-sonar" aria-label="竞赛分类声纳">
        <div className="competition-sonar__rings" aria-hidden="true">
          <span />
          <span />
          <span />
          <i />
          <b />
        </div>
        <span className="competition-sonar__sweep" aria-hidden="true" />

        {visibleCategories.length === 0 ? (
          <p className="competition-sonar__empty">新的竞赛航线即将出现。</p>
        ) : (
          visibleCategories.map(({ category, layout }, index) => (
            <button
              key={category.id}
              type="button"
              className="competition-sonar__target"
              style={
                {
                  "--target-x": `${layout.x}%`,
                  "--target-y": `${layout.y}%`,
                  "--scan-delay": `${layout.scanDelay}s`,
                } as React.CSSProperties
              }
              data-variant={(index % 3) + 1}
              aria-pressed={category.id === selectedId}
              aria-label={`${category.name}，${category.count} 篇文章`}
              onClick={() => selectCategory(category)}
            >
              <i aria-hidden="true" />
              <span>
                <strong>{category.name}</strong>
                <small>{category.count} 篇</small>
              </span>
            </button>
          ))
        )}
      </div>

      <header className="competition-radar__heading">
        <div className="chapter-label">
          <span>300m</span>
          <i aria-hidden="true" />
          <strong>竞赛航线</strong>
        </div>
        <Trophy
          className="chapter-icon chapter-icon--gold"
          size={28}
          strokeWidth={1.35}
          aria-hidden="true"
        />
        <h2 id="competition-title">把未知拆成问题，把问题变成可以抵达的坐标。</h2>
        <p>声纳捕获竞赛方向，北斗星位记录经验、资料与成果。</p>
      </header>

      <section
        className="competition-constellation"
        aria-label={selectedCategory ? `${selectedCategory.name}文章` : "精选竞赛文章"}
      >
        <header className="competition-constellation__header">
          <div>
            <span>{selectedCategory ? "LOCKED ROUTE" : "FEATURED SIGNALS"}</span>
            <h3>{selectedCategory?.name ?? "精选竞赛信号"}</h3>
          </div>
          {selectedCategory && (
            <button
              type="button"
              className="competition-constellation__close"
              onClick={showFeatured}
              aria-label="返回精选竞赛文章"
              title="返回精选竞赛文章"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </header>

        <div
          className="competition-constellation__map"
          aria-live="polite"
          aria-busy={batch.status === "loading"}
        >
          {batch.status === "ready" && batch.items.length > 1 && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline points={constellationPoints} />
            </svg>
          )}

          {batch.status === "loading" &&
            CONSTELLATION_POINTS.map((point, index) => (
              <span
                key={index}
                className="competition-constellation__loading-star"
                style={
                  {
                    "--star-x": `${point.x}%`,
                    "--star-y": `${point.y}%`,
                    animationDelay: `${index * 110}ms`,
                  } as React.CSSProperties
                }
                aria-hidden="true"
              />
            ))}

          {batch.status === "error" && (
            <div className="competition-constellation__message">
              <p>竞赛信号暂时中断。</p>
              <button
                type="button"
                onClick={() => void loadBatch(selectedCategory?.slug ?? null, null)}
              >
                重新探测
              </button>
            </div>
          )}

          {batch.status === "ready" && batch.items.length === 0 && (
            <div className="competition-constellation__message">
              <p>{selectedCategory ? "这条航线还没有公开文章。" : "暂未标记精选竞赛文章。"}</p>
            </div>
          )}

          {batch.status === "ready" &&
            batch.items.map((post, index) => {
              const point = CONSTELLATION_POINTS[index];
              return (
                <Link
                  key={`${batchVersion}-${post.id}`}
                  href={`/competition/${post.categorySlug}/${post.slug}`}
                  className="competition-constellation__star"
                  data-label={point.label}
                  style={
                    {
                      "--star-x": `${point.x}%`,
                      "--star-y": `${point.y}%`,
                      animationDelay: `${index * 115}ms`,
                    } as React.CSSProperties
                  }
                >
                  <i aria-hidden="true" />
                  <span>
                    <small>
                      {post.categoryName} · {formatRadarDate(post.publishedAt)}
                    </small>
                    <strong>{post.title}</strong>
                  </span>
                </Link>
              );
            })}
        </div>

        <footer className="competition-constellation__footer">
          {batch.total > 7 && (
            <button
              type="button"
              className="competition-constellation__batch"
              onClick={changeBatch}
              disabled={batch.status === "loading"}
            >
              <RefreshCw size={14} aria-hidden="true" />
              换一批
            </button>
          )}
          <Link
            href={selectedCategory ? `/competition/${selectedCategory.slug}` : "/competition"}
            className="competition-constellation__enter"
          >
            {selectedCategory ? "进入该竞赛" : "进入竞赛中心"}
            {selectedCategory ? (
              <ArrowUpRight size={15} aria-hidden="true" />
            ) : (
              <ChevronRight size={15} aria-hidden="true" />
            )}
          </Link>
        </footer>
      </section>
    </div>
  );
}
