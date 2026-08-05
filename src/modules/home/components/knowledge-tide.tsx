"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, RefreshCw, X } from "lucide-react";
import * as d3Drag from "d3-drag";
import * as d3Force from "d3-force";
import * as d3Selection from "d3-selection";
import type { HomeCategory } from "../home.types";

type TidePost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  authorName: string;
};

type TideBatch = {
  items: TidePost[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

type BatchState = TideBatch & {
  status: "idle" | "loading" | "ready" | "error";
};

interface SimNode extends d3Force.SimulationNodeDatum {
  id: string;
  index: number;
  radius: number;
  visualWidth: number;
  visualHeight: number;
  seed: number;
}

type PanelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const EMPTY_BATCH: BatchState = {
  status: "idle",
  items: [],
  nextCursor: null,
  hasMore: false,
  total: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isTidePost(value: unknown): value is TidePost {
  if (!value || typeof value !== "object") return false;
  const post = value as Record<string, unknown>;
  return (
    typeof post.id === "string" &&
    typeof post.title === "string" &&
    typeof post.slug === "string" &&
    (typeof post.excerpt === "string" || post.excerpt === null) &&
    (typeof post.publishedAt === "string" || post.publishedAt === null) &&
    typeof post.authorName === "string"
  );
}

function parseTideBatch(value: unknown): TideBatch {
  if (!value || typeof value !== "object") throw new Error("文章批次响应格式无效");
  const batch = value as Record<string, unknown>;
  if (
    !Array.isArray(batch.items) ||
    !batch.items.every(isTidePost) ||
    !(typeof batch.nextCursor === "string" || batch.nextCursor === null) ||
    typeof batch.hasMore !== "boolean" ||
    typeof batch.total !== "number"
  ) {
    throw new Error("文章批次响应格式无效");
  }

  return {
    items: batch.items,
    nextCursor: batch.nextCursor,
    hasMore: batch.hasMore,
    total: batch.total,
  };
}

async function requestBatch(
  categorySlug: string,
  cursor: string | null,
  signal?: AbortSignal
): Promise<TideBatch> {
  const params = new URLSearchParams({ slug: categorySlug, limit: "5" });
  if (cursor) params.set("cursor", cursor);

  const response = await fetch(`/api/graph-posts?${params.toString()}`, { signal });
  if (!response.ok) throw new Error("文章信号读取失败");
  return parseTideBatch(await response.json());
}

function formatPostDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function createOceanCurrentForce(): d3Force.Force<SimNode, undefined> {
  let nodes: SimNode[] = [];
  const force: d3Force.Force<SimNode, undefined> = (alpha) => {
    const time = performance.now() * 0.00016;
    for (const node of nodes) {
      if (node.fx !== undefined && node.fx !== null) continue;
      node.vx = (node.vx ?? 0) + Math.sin(time + node.seed) * 0.034 * alpha;
      node.vy = (node.vy ?? 0) + Math.cos(time * 0.83 + node.seed * 1.7) * 0.025 * alpha;
    }
  };
  force.initialize = (initializedNodes) => {
    nodes = initializedNodes;
  };
  return force;
}

function Jellyfish({ index }: { index: number }) {
  const gradientId = `knowledge-jelly-gradient-${index}`;
  return (
    <svg className="knowledge-jelly__body" viewBox="0 0 140 150" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#dffbff" stopOpacity="0.9" />
          <stop offset="0.46" stopColor="#73d8e8" stopOpacity="0.62" />
          <stop offset="1" stopColor="#1f8faa" stopOpacity="0.16" />
        </linearGradient>
      </defs>
      <path
        className="knowledge-jelly__bell"
        d="M20 68C22 31 42 13 70 13C98 13 118 31 120 68C103 61 93 76 70 68C47 76 37 61 20 68Z"
        fill={`url(#${gradientId})`}
      />
      <path className="knowledge-jelly__rim" d="M23 65C43 57 49 75 70 67C91 75 97 57 117 65" />
      <path
        className="knowledge-jelly__vein"
        d="M45 59C48 38 56 26 70 18M95 59C92 38 84 26 70 18"
      />
      <g className="knowledge-jelly__tentacles">
        <path d="M37 69C29 89 48 101 35 135" />
        <path d="M54 71C46 94 63 108 53 144" />
        <path d="M70 70C62 96 80 112 69 147" />
        <path d="M87 71C78 94 98 109 88 143" />
        <path d="M103 69C94 89 113 103 104 135" />
      </g>
    </svg>
  );
}

export function KnowledgeTide({ categories }: { categories: HomeCategory[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const simulationRef = useRef<d3Force.Simulation<SimNode, undefined> | null>(null);
  const simNodesRef = useRef(new Map<string, SimNode>());
  const nodeElementsRef = useRef(new Map<string, HTMLButtonElement>());
  const pathElementsRef = useRef(new Map<string, SVGPathElement>());
  const panelRectRef = useRef<PanelRect | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const batchCacheRef = useRef(new Map<string, TideBatch>());
  const updatePanelRef = useRef<() => void>(() => undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [batch, setBatch] = useState<BatchState>(EMPTY_BATCH);
  const [batchVersion, setBatchVersion] = useState(0);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedId) ?? null,
    [categories, selectedId]
  );

  const loadBatch = useCallback(async (category: HomeCategory, cursor: string | null) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const cacheKey = `${category.slug}:${cursor ?? "first"}`;
    const cached = batchCacheRef.current.get(cacheKey);

    setBatch((current) => ({
      ...current,
      status: "loading",
      items: [],
      nextCursor: null,
      hasMore: false,
    }));

    try {
      const result = cached ?? (await requestBatch(category.slug, cursor, controller.signal));
      if (controller.signal.aborted || selectedIdRef.current !== category.id) return;
      batchCacheRef.current.set(cacheKey, result);
      setBatch({ ...result, status: "ready" });
      setBatchVersion((version) => version + 1);

      if (result.hasMore && result.nextCursor) {
        const nextKey = `${category.slug}:${result.nextCursor}`;
        if (!batchCacheRef.current.has(nextKey)) {
          void requestBatch(category.slug, result.nextCursor)
            .then((nextResult) => batchCacheRef.current.set(nextKey, nextResult))
            .catch((error: unknown) => {
              if (process.env.NODE_ENV !== "production") {
                console.debug("Knowledge tide prefetch skipped", error);
              }
            });
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to load knowledge tide articles", error);
      }
      setBatch({ ...EMPTY_BATCH, status: "error" });
    }
  }, []);

  const closeSelection = useCallback(() => {
    requestControllerRef.current?.abort();
    const currentId = selectedIdRef.current;
    if (currentId) {
      const node = simNodesRef.current.get(currentId);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
    }
    selectedIdRef.current = null;
    panelRectRef.current = null;
    setSelectedId(null);
    setBatch(EMPTY_BATCH);
    simulationRef.current?.alphaTarget(0.035).restart();
  }, []);

  const selectCategory = useCallback(
    (category: HomeCategory) => {
      if (selectedIdRef.current === category.id) {
        closeSelection();
        return;
      }

      const previousId = selectedIdRef.current;
      if (previousId) {
        const previousNode = simNodesRef.current.get(previousId);
        if (previousNode) {
          previousNode.fx = null;
          previousNode.fy = null;
        }
      }

      selectedIdRef.current = category.id;
      setSelectedId(category.id);
      const node = simNodesRef.current.get(category.id);
      if (node) {
        node.fx = node.x;
        node.fy = node.y;
      }
      simulationRef.current?.alpha(0.18).alphaTarget(0.035).restart();
      window.requestAnimationFrame(() => updatePanelRef.current());
      void loadBatch(category, null);
    },
    [closeSelection, loadBatch]
  );

  const changeBatch = useCallback(() => {
    if (!selectedCategory) return;
    void loadBatch(selectedCategory, batch.hasMore ? batch.nextCursor : null);
  }, [batch.hasMore, batch.nextCursor, loadBatch, selectedCategory]);

  const pinNode = useCallback((id: string) => {
    if (draggingIdRef.current === id || selectedIdRef.current === id) return;
    const node = simNodesRef.current.get(id);
    if (!node) return;
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  const releaseNode = useCallback((id: string) => {
    if (draggingIdRef.current === id || selectedIdRef.current === id) return;
    const node = simNodesRef.current.get(id);
    if (!node) return;
    node.fx = null;
    node.fy = null;
    simulationRef.current?.alphaTarget(0.035).restart();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedIdRef.current) closeSelection();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSelection]);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage || categories.length === 0) return;
    const nodeElements = nodeElementsRef.current;

    let width = stage.clientWidth || 560;
    let height = stage.clientHeight || 460;
    let isMobile = window.matchMedia("(max-width: 820px)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const center = () => ({ x: width / 2, y: height / 2 });
    const nodeRadius = () => (isMobile ? 42 : width < 520 ? 50 : 61);
    const visualSize = () => (isMobile ? { width: 92, height: 108 } : { width: 132, height: 150 });

    const simNodes: SimNode[] = categories.map((category, index) => {
      const angle = (index / Math.max(categories.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const ring = Math.min(width, height) * (0.27 + (index % 2) * 0.035);
      const size = visualSize();
      return {
        id: category.id,
        index,
        radius: nodeRadius(),
        visualWidth: size.width,
        visualHeight: size.height,
        seed: index * 1.83 + 0.7,
        x: width / 2 + Math.cos(angle) * ring,
        y: height / 2 + Math.sin(angle) * ring * 0.76,
      };
    });
    simNodesRef.current = new Map(simNodes.map((node) => [node.id, node]));

    let forceNodes = simNodes;
    const boundaryForce: d3Force.Force<SimNode, undefined> = (alpha) => {
      const padding = isMobile ? 8 : 12;
      const panelRect = panelRectRef.current;
      for (const node of forceNodes) {
        const x = node.x ?? width / 2;
        const y = node.y ?? height / 2;
        const minX = padding + node.visualWidth / 2;
        const maxX = width - padding - node.visualWidth / 2;
        const minY = padding + node.visualHeight / 2;
        const maxY = height - padding - node.visualHeight / 2;

        if (x < minX) node.vx = (node.vx ?? 0) + (minX - x) * 0.24 * alpha;
        if (x > maxX) node.vx = (node.vx ?? 0) - (x - maxX) * 0.24 * alpha;
        if (y < minY) node.vy = (node.vy ?? 0) + (minY - y) * 0.24 * alpha;
        if (y > maxY) node.vy = (node.vy ?? 0) - (y - maxY) * 0.24 * alpha;

        if (!panelRect || node.id === selectedIdRef.current) continue;
        const margin = node.radius + 8;
        const insideX = x > panelRect.x - margin && x < panelRect.x + panelRect.width + margin;
        const insideY = y > panelRect.y - margin && y < panelRect.y + panelRect.height + margin;
        if (!insideX || !insideY) continue;

        const distances = [
          { axis: "x" as const, value: panelRect.x - margin - x },
          { axis: "x" as const, value: panelRect.x + panelRect.width + margin - x },
          { axis: "y" as const, value: panelRect.y - margin - y },
          { axis: "y" as const, value: panelRect.y + panelRect.height + margin - y },
        ].sort((a, b) => Math.abs(a.value) - Math.abs(b.value));
        const escape = distances[0];
        if (escape?.axis === "x") node.vx = (node.vx ?? 0) + escape.value * 0.3 * alpha;
        if (escape?.axis === "y") node.vy = (node.vy ?? 0) + escape.value * 0.3 * alpha;
      }
    };
    boundaryForce.initialize = (initializedNodes) => {
      forceNodes = initializedNodes;
    };

    const radialForce = d3Force
      .forceRadial<SimNode>(() => Math.min(width, height) * 0.3, width / 2, height / 2)
      .strength(0.025);
    const xForce = d3Force.forceX<SimNode>(width / 2).strength(0.012);
    const yForce = d3Force.forceY<SimNode>(height / 2).strength(0.018);
    const collisionForce = d3Force
      .forceCollide<SimNode>()
      .radius((node) => node.radius + (isMobile ? 4 : 8))
      .iterations(2);
    const simulation = d3Force
      .forceSimulation<SimNode>(simNodes)
      .force("charge", d3Force.forceManyBody<SimNode>().strength(isMobile ? -105 : -190))
      .force("radial", radialForce)
      .force("x", xForce)
      .force("y", yForce)
      .force("collision", collisionForce)
      .force("current", createOceanCurrentForce())
      .force("boundary", boundaryForce)
      .velocityDecay(0.58)
      .alphaDecay(0.035)
      .alphaTarget(isReducedMotion ? 0 : 0.035);
    simulationRef.current = simulation;

    const updatePanel = () => {
      const panel = panelRef.current;
      const selectedNode = selectedIdRef.current
        ? simNodesRef.current.get(selectedIdRef.current)
        : null;
      if (!panel || !selectedNode || isMobile) {
        panelRectRef.current = null;
        return;
      }

      const x = selectedNode.x ?? width / 2;
      const y = selectedNode.y ?? height / 2;
      const panelWidth = clamp(width * 0.46, 248, 310);
      const panelHeight = clamp(height - 24, 258, 300);
      const gap = 28;
      const radius = selectedNode.radius;
      const candidates = [
        { x: x + radius + gap, y: y - panelHeight / 2 },
        { x: x - radius - gap - panelWidth, y: y - panelHeight / 2 },
        { x: x + radius + gap, y: y + radius * 0.35 },
        { x: x - radius - gap - panelWidth, y: y + radius * 0.35 },
      ];

      const score = (candidate: { x: number; y: number }) => {
        const overflow =
          Math.max(12 - candidate.x, 0) +
          Math.max(candidate.x + panelWidth - (width - 12), 0) +
          Math.max(12 - candidate.y, 0) +
          Math.max(candidate.y + panelHeight - (height - 12), 0);
        return overflow;
      };
      const candidate = candidates.sort((a, b) => score(a) - score(b))[0] ?? candidates[0];
      const panelX = clamp(candidate.x, 12, Math.max(12, width - panelWidth - 12));
      const panelY = clamp(candidate.y, 12, Math.max(12, height - panelHeight - 12));
      panel.style.width = `${panelWidth}px`;
      panel.style.height = `${panelHeight}px`;
      panel.style.transform = `translate3d(${panelX}px, ${panelY}px, 0)`;
      panelRectRef.current = { x: panelX, y: panelY, width: panelWidth, height: panelHeight };
    };
    updatePanelRef.current = updatePanel;

    const updateVisuals = () => {
      const core = center();
      for (const node of simNodes) {
        const x = node.x ?? core.x;
        const y = node.y ?? core.y;
        const element = nodeElements.get(node.id);
        if (element) {
          element.style.transform = `translate3d(${x - node.visualWidth / 2}px, ${y - node.visualHeight / 2}px, 0)`;
        }
        const path = pathElementsRef.current.get(node.id);
        if (path) {
          const midX = (core.x + x) / 2;
          const midY = (core.y + y) / 2;
          const bend = (node.index % 2 === 0 ? 1 : -1) * Math.min(24, Math.abs(x - core.x) * 0.08);
          path.setAttribute("d", `M ${core.x} ${core.y} Q ${midX + bend} ${midY} ${x} ${y}`);
        }
      }
      updatePanel();
    };
    simulation.on("tick", updateVisuals);

    const dragBehavior = d3Drag
      .drag<HTMLButtonElement, SimNode>()
      .container(stage)
      .clickDistance(6)
      .on("start", (event, node) => {
        draggingIdRef.current = node.id;
        if (!event.active) simulation.alphaTarget(isReducedMotion ? 0 : 0.11).restart();
        node.fx = node.x;
        node.fy = node.y;
      })
      .on("drag", (event, node) => {
        node.fx = clamp(event.x, node.visualWidth / 2, width - node.visualWidth / 2);
        node.fy = clamp(event.y, node.visualHeight / 2, height - node.visualHeight / 2);
        if (selectedIdRef.current === node.id) updatePanel();
      })
      .on("end", (event, node) => {
        draggingIdRef.current = null;
        if (selectedIdRef.current !== node.id) {
          node.fx = null;
          node.fy = null;
        }
        if (!event.active) simulation.alphaTarget(isReducedMotion ? 0 : 0.035);
      });

    for (const node of simNodes) {
      const element = nodeElements.get(node.id);
      if (element) d3Selection.select(element).datum(node).call(dragBehavior);
    }

    const resizeObserver = new ResizeObserver(() => {
      width = stage.clientWidth || width;
      height = stage.clientHeight || height;
      isMobile = window.matchMedia("(max-width: 820px)").matches;
      const size = visualSize();
      for (const node of simNodes) {
        node.radius = nodeRadius();
        node.visualWidth = size.width;
        node.visualHeight = size.height;
      }
      xForce.x(width / 2);
      yForce.y(height / 2);
      radialForce
        .radius(Math.min(width, height) * 0.3)
        .x(width / 2)
        .y(height / 2);
      collisionForce.radius((node) => node.radius + (isMobile ? 4 : 8));
      simulation.alpha(0.22).restart();
      updateVisuals();
    });
    resizeObserver.observe(stage);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !document.hidden) {
          simulation.alphaTarget(isReducedMotion ? 0 : 0.035).restart();
        } else {
          simulation.stop();
        }
      },
      { threshold: 0.08 }
    );
    intersectionObserver.observe(stage);

    const handleVisibility = () => {
      if (document.hidden) simulation.stop();
      else simulation.alphaTarget(isReducedMotion ? 0 : 0.035).restart();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    updateVisuals();

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      for (const element of nodeElements.values()) {
        d3Selection.select(element).on(".drag", null);
      }
      simulation.stop();
      simulationRef.current = null;
      simNodesRef.current.clear();
      panelRectRef.current = null;
    };
  }, [categories]);

  if (categories.length === 0) {
    return <p className="empty-signal knowledge-tide__empty">知识节点正在汇聚。</p>;
  }

  return (
    <div
      ref={rootRef}
      className="knowledge-tide"
      data-selected={selectedId ? "true" : "false"}
      aria-label="可拖拽的知识库分类图谱"
    >
      <div ref={stageRef} className="knowledge-tide__stage" onClick={closeSelection}>
        <svg className="knowledge-tide__links" aria-hidden="true">
          <defs>
            <filter id="knowledge-link-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {categories.map((category) => (
            <path
              key={category.id}
              ref={(element) => {
                if (element) pathElementsRef.current.set(category.id, element);
                else pathElementsRef.current.delete(category.id);
              }}
              className={category.id === selectedId ? "is-selected" : undefined}
            />
          ))}
        </svg>

        <span className="knowledge-tide__core" aria-hidden="true">
          <i />
          <small>TIDE</small>
        </span>

        {categories.map((category, index) => (
          <button
            key={category.id}
            ref={(element) => {
              if (element) nodeElementsRef.current.set(category.id, element);
              else nodeElementsRef.current.delete(category.id);
            }}
            type="button"
            className="knowledge-jelly"
            data-variant={(index % 3) + 1}
            aria-pressed={category.id === selectedId}
            aria-label={`${category.name}，${category.count} 篇文章`}
            onClick={(event) => {
              event.stopPropagation();
              selectCategory(category);
            }}
            onPointerEnter={() => pinNode(category.id)}
            onPointerLeave={() => releaseNode(category.id)}
            onFocus={() => pinNode(category.id)}
            onBlur={() => releaseNode(category.id)}
          >
            <span className="knowledge-jelly__halo" aria-hidden="true" />
            <Jellyfish index={index} />
            <span className="knowledge-jelly__label">{category.name}</span>
            <span className="knowledge-jelly__count">{category.count} 篇</span>
          </button>
        ))}
      </div>

      <section
        ref={panelRef}
        className="knowledge-tide__panel"
        aria-label={selectedCategory ? `${selectedCategory.name}文章` : "分类文章"}
        aria-hidden={!selectedCategory}
        onClick={(event) => event.stopPropagation()}
      >
        {selectedCategory && (
          <>
            <header className="knowledge-tide__panel-header">
              <div>
                <span>SELECTED CURRENT</span>
                <h3>{selectedCategory.name}</h3>
              </div>
              <button
                type="button"
                className="knowledge-tide__icon-button"
                onClick={closeSelection}
                aria-label="关闭文章列表"
                title="关闭文章列表"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>

            <div
              className="knowledge-tide__articles"
              aria-live="polite"
              aria-busy={batch.status === "loading"}
            >
              {batch.status === "loading" &&
                Array.from({ length: 5 }, (_, index) => (
                  <span
                    key={index}
                    className="knowledge-tide__loading-signal"
                    style={{ animationDelay: `${index * 110}ms` }}
                    aria-hidden="true"
                  />
                ))}

              {batch.status === "error" && (
                <div className="knowledge-tide__message">
                  <p>文章信号暂时中断。</p>
                  <button type="button" onClick={() => void loadBatch(selectedCategory, null)}>
                    重新连接
                  </button>
                </div>
              )}

              {batch.status === "ready" && batch.items.length === 0 && (
                <div className="knowledge-tide__message">
                  <p>这片知识域还没有公开文章。</p>
                </div>
              )}

              {batch.status === "ready" &&
                batch.items.map((post, index) => {
                  const date = formatPostDate(post.publishedAt);
                  return (
                    <Link
                      key={`${batchVersion}-${post.id}`}
                      href={`/knowledge-base/${selectedCategory.slug}/${post.slug}`}
                      className="knowledge-tide__article"
                      style={{ animationDelay: `${index * 120}ms` }}
                    >
                      <i aria-hidden="true" />
                      <span>
                        <strong>{post.title}</strong>
                        <small>
                          {post.authorName}
                          {date ? ` · ${date}` : ""}
                        </small>
                      </span>
                    </Link>
                  );
                })}
            </div>

            <footer className="knowledge-tide__panel-footer">
              {batch.total > 5 && (
                <button
                  type="button"
                  className="knowledge-tide__batch-button"
                  onClick={changeBatch}
                  disabled={batch.status === "loading"}
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  换一批
                </button>
              )}
              <Link
                href={`/knowledge-base/${selectedCategory.slug}`}
                className="knowledge-tide__category-link"
              >
                进入分类
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
