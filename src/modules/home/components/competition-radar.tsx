"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronRight, RefreshCw, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createCompetitionConstellationLabelLayouts,
  projectCompetitionConstellationStar,
} from "../competition-constellation-layout";
import { selectCompetitionConstellation } from "../competition-constellations";
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

const SONAR_TICKS = Array.from({ length: 36 }, (_, index) => ({
  angle: index * 10,
  major: index % 3 === 0,
}));

const SONAR_BEARINGS = [
  { label: "000°", x: 50, y: 2 },
  { label: "090°", x: 98, y: 50 },
  { label: "180°", x: 50, y: 98 },
  { label: "270°", x: 2, y: 50 },
] as const;

const SONAR_CLUTTER = [
  { x: 30, y: 20, delay: -1.2 },
  { x: 67, y: 19, delay: -4.8 },
  { x: 84, y: 42, delay: -7.1 },
  { x: 44, y: 29, delay: -2.9 },
  { x: 17, y: 58, delay: -6.2 },
  { x: 42, y: 72, delay: -8.4 },
  { x: 76, y: 78, delay: -3.7 },
  { x: 56, y: 61, delay: -5.5 },
] as const;

const SONAR_MINERALS = [
  { x: -2, y: 17, size: 2, delay: -1.4 },
  { x: 12, y: 4, size: 3, delay: -4.1 },
  { x: 38, y: -3, size: 2, delay: -2.7 },
  { x: 73, y: 1, size: 2, delay: -6.5 },
  { x: 97, y: 20, size: 3, delay: -3.6 },
  { x: 103, y: 63, size: 2, delay: -7.4 },
  { x: 83, y: 94, size: 2, delay: -5.2 },
  { x: 55, y: 103, size: 3, delay: -2.1 },
  { x: 19, y: 96, size: 2, delay: -6.9 },
  { x: -4, y: 72, size: 2, delay: -4.8 },
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
  const [constellationKey, setConstellationKey] = useState("featured:first");

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
  const selectedTarget = useMemo(
    () => visibleCategories.find(({ category }) => category.id === selectedId) ?? null,
    [selectedId, visibleCategories]
  );
  const constellation = useMemo(
    () => selectCompetitionConstellation(constellationKey),
    [constellationKey]
  );
  const articleLayouts = useMemo(
    () => createCompetitionConstellationLabelLayouts(constellation, batch.items.length),
    [batch.items.length, constellation]
  );
  const litStarIndices = useMemo(
    () => new Set(articleLayouts.map((layout) => layout.starIndex)),
    [articleLayouts]
  );

  const loadBatch = useCallback(async (categorySlug: string | null, cursor: string | null) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const mode = categorySlug ?? "featured";
    const cacheKey = `${mode}:${cursor ?? "first"}`;
    const cached = batchCacheRef.current.get(cacheKey);
    setConstellationKey(
      categorySlug ? `category:${categorySlug}` : `featured:${cursor ?? "first"}`
    );

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

  const selectedBearing = selectedTarget
    ? String(Math.round(selectedTarget.layout.bearing)).padStart(3, "0")
    : null;

  return (
    <div className="competition-radar" data-selected={selectedCategory ? "true" : "false"}>
      <div className="competition-sonar" aria-label="竞赛分类声纳">
        <div className="competition-sonar__minerals" aria-hidden="true">
          {SONAR_MINERALS.map((particle) => (
            <i
              key={`${particle.x}:${particle.y}`}
              style={
                {
                  "--mineral-x": `${particle.x}%`,
                  "--mineral-y": `${particle.y}%`,
                  "--mineral-size": `${particle.size}px`,
                  "--mineral-delay": `${particle.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="competition-sonar__rings" aria-hidden="true">
          <span />
          <span />
          <span />
          <i />
          <b />
        </div>
        <div className="competition-sonar__ticks" aria-hidden="true">
          {SONAR_TICKS.map((tick) => (
            <i
              key={tick.angle}
              className={tick.major ? "is-major" : undefined}
              style={{ "--tick-angle": `${tick.angle}deg` } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="competition-sonar__bearings" aria-hidden="true">
          {SONAR_BEARINGS.map((bearing) => (
            <span
              key={bearing.label}
              style={
                {
                  "--bearing-x": `${bearing.x}%`,
                  "--bearing-y": `${bearing.y}%`,
                } as React.CSSProperties
              }
            >
              {bearing.label}
            </span>
          ))}
        </div>
        <span className="competition-sonar__ping competition-sonar__ping--one" aria-hidden="true" />
        <span className="competition-sonar__ping competition-sonar__ping--two" aria-hidden="true" />
        <div className="competition-sonar__clutter" aria-hidden="true">
          {SONAR_CLUTTER.map((echo) => (
            <i
              key={`${echo.x}:${echo.y}`}
              style={
                {
                  "--echo-x": `${echo.x}%`,
                  "--echo-y": `${echo.y}%`,
                  "--echo-delay": `${echo.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <span className="competition-sonar__sweep" aria-hidden="true">
          <i />
          <b />
        </span>

        {selectedTarget && selectedBearing && (
          <div className="competition-sonar__lock" aria-hidden="true">
            <span
              className="competition-sonar__lock-line"
              style={
                {
                  "--lock-angle": `${selectedTarget.layout.angle}deg`,
                  "--lock-distance": `${selectedTarget.layout.distance}%`,
                } as React.CSSProperties
              }
            />
            <span
              className="competition-sonar__lock-readout"
              data-position={selectedTarget.layout.y > 65 ? "above" : "below"}
              style={
                {
                  "--lock-x": `${selectedTarget.layout.x}%`,
                  "--lock-y": `${selectedTarget.layout.y}%`,
                } as React.CSSProperties
              }
            >
              AZ {selectedBearing}° · LOCKED
            </span>
          </div>
        )}

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
              data-bearing={String(Math.round(layout.bearing)).padStart(3, "0")}
              aria-pressed={category.id === selectedId}
              aria-label={`${category.name}，${category.count} 篇文章`}
              onClick={() => selectCategory(category)}
            >
              <i aria-hidden="true" />
              <span>
                <strong>{category.name}</strong>
                <small>
                  {String(Math.round(layout.bearing)).padStart(3, "0")}° · {category.count} 篇
                </small>
              </span>
            </button>
          ))
        )}
      </div>

      <div
        className="competition-radar__signal-path"
        data-active={selectedCategory ? "true" : "false"}
        aria-hidden="true"
      >
        <span />
        <i />
        <b />
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
        <p>声纳捕获竞赛方向，星座航图记录经验、资料与成果。</p>
      </header>

      <section
        className="competition-constellation"
        aria-label={selectedCategory ? `${selectedCategory.name}文章` : "精选竞赛文章"}
      >
        <header className="competition-constellation__header">
          <div>
            <span>
              {selectedCategory ? "LOCKED ROUTE" : "FEATURED SIGNALS"} · {constellation.name}
            </span>
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
          <svg
            className="competition-constellation__chart competition-constellation__chart--desktop"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g className="competition-constellation__lines">
              {constellation.edges.map(([sourceIndex, targetIndex], index) => {
                const sourceStar = constellation.stars[sourceIndex];
                const targetStar = constellation.stars[targetIndex];
                const projectedSource = projectCompetitionConstellationStar(sourceStar);
                const projectedTarget = projectCompetitionConstellationStar(targetStar);
                const isLit = litStarIndices.has(sourceIndex) && litStarIndices.has(targetIndex);
                return (
                  <line
                    key={`${sourceIndex}:${targetIndex}:${index}`}
                    className={isLit ? "is-lit" : undefined}
                    x1={projectedSource.x}
                    y1={projectedSource.y}
                    x2={projectedTarget.x}
                    y2={projectedTarget.y}
                  />
                );
              })}
            </g>
            <g className="competition-constellation__base-stars">
              {constellation.stars.map((star, index) => {
                const projectedStar = projectCompetitionConstellationStar(star);
                return (
                  <circle
                    key={index}
                    className={litStarIndices.has(index) ? "is-lit" : undefined}
                    cx={projectedStar.x}
                    cy={projectedStar.y}
                    r={litStarIndices.has(index) ? 0.86 : 0.58}
                  />
                );
              })}
            </g>
            <g className="competition-constellation__leader-lines">
              {articleLayouts.map((layout) => (
                <polyline
                  key={layout.articleIndex}
                  points={`${layout.starX},${layout.starY} ${layout.elbowX},${layout.labelY} ${layout.railX},${layout.labelY}`}
                  style={{ animationDelay: `${layout.articleIndex * 115}ms` }}
                />
              ))}
            </g>
          </svg>

          <svg
            className="competition-constellation__chart competition-constellation__chart--mobile"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g className="competition-constellation__lines">
              {constellation.edges.map(([sourceIndex, targetIndex], index) => {
                const source = constellation.stars[sourceIndex];
                const target = constellation.stars[targetIndex];
                const isLit = litStarIndices.has(sourceIndex) && litStarIndices.has(targetIndex);
                return (
                  <line
                    key={`${sourceIndex}:${targetIndex}:${index}`}
                    className={isLit ? "is-lit" : undefined}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                  />
                );
              })}
            </g>
            <g className="competition-constellation__base-stars">
              {constellation.stars.map((star, index) => (
                <circle
                  key={index}
                  className={litStarIndices.has(index) ? "is-lit" : undefined}
                  cx={star.x}
                  cy={star.y}
                  r={litStarIndices.has(index) ? 1.1 : 0.72}
                />
              ))}
            </g>
          </svg>

          {batch.status === "loading" &&
            constellation.articleAnchors.map((anchor, index) => {
              const star = constellation.stars[anchor.starIndex];
              const projectedStar = projectCompetitionConstellationStar(star);
              return (
                <span
                  key={anchor.starIndex}
                  className="competition-constellation__loading-star"
                  style={
                    {
                      "--star-x": `${projectedStar.x}%`,
                      "--star-y": `${projectedStar.y}%`,
                      "--mobile-star-x": `${star.x}%`,
                      "--mobile-star-y": `${star.y}%`,
                      animationDelay: `${index * 110}ms`,
                    } as React.CSSProperties
                  }
                  aria-hidden="true"
                />
              );
            })}

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
              const layout = articleLayouts[index];
              const star = constellation.stars[layout.starIndex];
              return (
                <span
                  key={`${batchVersion}-${post.id}`}
                  className="competition-constellation__article-node"
                  style={
                    {
                      "--star-x": `${layout.starX}%`,
                      "--star-y": `${layout.starY}%`,
                      "--mobile-star-x": `${star.x}%`,
                      "--mobile-star-y": `${star.y}%`,
                      animationDelay: `${index * 115}ms`,
                    } as React.CSSProperties
                  }
                  aria-hidden="true"
                >
                  <i aria-hidden="true" />
                  <b>{index + 1}</b>
                </span>
              );
            })}

          {batch.status === "ready" &&
            batch.items.map((post, index) => {
              const layout = articleLayouts[index];
              return (
                <Link
                  key={`label-${batchVersion}-${post.id}`}
                  href={`/competition/${post.categorySlug}/${post.slug}`}
                  className="competition-constellation__article-label"
                  data-side={layout.side}
                  style={
                    {
                      "--label-y": `${layout.labelY}%`,
                      animationDelay: `${index * 115}ms`,
                    } as React.CSSProperties
                  }
                >
                  <small>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    {post.categoryName} · {formatRadarDate(post.publishedAt)}
                  </small>
                  <strong>{post.title}</strong>
                </Link>
              );
            })}
        </div>

        {batch.status === "ready" && batch.items.length > 0 && (
          <div className="competition-constellation__mobile-list">
            {batch.items.map((post, index) => (
              <Link
                key={`mobile-${batchVersion}-${post.id}`}
                href={`/competition/${post.categorySlug}/${post.slug}`}
              >
                <span>{index + 1}</span>
                <strong>{post.title}</strong>
              </Link>
            ))}
          </div>
        )}

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
