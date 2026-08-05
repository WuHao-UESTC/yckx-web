"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, RefreshCw, X } from "lucide-react";
import * as d3Drag from "d3-drag";
import * as d3Force from "d3-force";
import * as d3Selection from "d3-selection";
import { createTideAnchor, createTideLinks } from "../knowledge-tide-graph";
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
  anchorX: number;
  anchorY: number;
}

interface SimLink extends d3Force.SimulationLinkDatum<SimNode> {
  id: string;
  lengthRatio: number;
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

function createOceanCurrentForce(
  isCalmed: (nodeId: string) => boolean
): d3Force.Force<SimNode, undefined> {
  let nodes: SimNode[] = [];
  const force: d3Force.Force<SimNode, undefined> = (alpha) => {
    const time = performance.now() * 0.00016;
    for (const node of nodes) {
      if ((node.fx !== undefined && node.fx !== null) || isCalmed(node.id)) continue;
      node.vx = (node.vx ?? 0) + Math.sin(time + node.seed) * 0.22 * alpha;
      node.vy = (node.vy ?? 0) + Math.cos(time * 0.83 + node.seed * 1.7) * 0.16 * alpha;
    }
  };
  force.initialize = (initializedNodes) => {
    nodes = initializedNodes;
  };
  return force;
}

function Jellyfish() {
  return (
    <svg className="knowledge-jelly__body" viewBox="0 0 112 96" aria-hidden="true">
      <path
        className="knowledge-jelly__bell"
        d="M18 43C20 19 34 8 56 8C78 8 92 19 94 43C81 38 72 50 56 43C40 50 31 38 18 43Z"
      />
      <g className="knowledge-jelly__tentacles">
        <path d="M33 44C27 58 40 67 32 88" />
        <path d="M48 45C41 62 56 72 48 94" />
        <path d="M64 45C57 63 73 72 65 94" />
        <path d="M79 44C73 58 86 68 79 88" />
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
  const linkElementsRef = useRef(new Map<string, SVGLineElement>());
  const panelRectRef = useRef<PanelRect | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const calmedIdsRef = useRef(new Set<string>());
  const requestControllerRef = useRef<AbortController | null>(null);
  const batchCacheRef = useRef(new Map<string, TideBatch>());
  const updatePanelRef = useRef<() => void>(() => undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [batch, setBatch] = useState<BatchState>(EMPTY_BATCH);
  const [batchVersion, setBatchVersion] = useState(0);

  const tideLinks = useMemo(() => createTideLinks(categories), [categories]);
  const emphasizedId = draggingId ?? hoveredId ?? focusedId;
  const emphasizedNeighbors = useMemo(() => {
    const neighbors = new Set<string>();
    if (!emphasizedId) return neighbors;
    for (const link of tideLinks) {
      if (link.sourceId === emphasizedId) neighbors.add(link.targetId);
      if (link.targetId === emphasizedId) neighbors.add(link.sourceId);
    }
    return neighbors;
  }, [emphasizedId, tideLinks]);

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
    simulationRef.current?.alphaTarget(0.028).restart();
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
      simulationRef.current?.alpha(0.18).alphaTarget(0.028).restart();
      window.requestAnimationFrame(() => updatePanelRef.current());
      void loadBatch(category, null);
    },
    [closeSelection, loadBatch]
  );

  const changeBatch = useCallback(() => {
    if (!selectedCategory) return;
    void loadBatch(selectedCategory, batch.hasMore ? batch.nextCursor : null);
  }, [batch.hasMore, batch.nextCursor, loadBatch, selectedCategory]);

  const calmNode = useCallback((id: string) => {
    calmedIdsRef.current.add(id);
    const node = simNodesRef.current.get(id);
    if (!node) return;
    node.vx = (node.vx ?? 0) * 0.18;
    node.vy = (node.vy ?? 0) * 0.18;
  }, []);

  const releaseNode = useCallback((id: string) => {
    if (draggingIdRef.current === id) return;
    calmedIdsRef.current.delete(id);
    simulationRef.current?.alphaTarget(0.028).restart();
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
    const calmedIds = calmedIdsRef.current;

    let width = stage.clientWidth || 560;
    let height = stage.clientHeight || 460;
    let isMobile = window.matchMedia("(max-width: 820px)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const center = () => ({ x: width / 2, y: height / 2 });
    const nodeRadius = () => (isMobile ? 39 : width < 520 ? 45 : 53);
    const visualSize = () => (isMobile ? { width: 86, height: 102 } : { width: 118, height: 132 });

    const simNodes: SimNode[] = categories.map((category, index) => {
      const anchor = createTideAnchor(category.id);
      const size = visualSize();
      return {
        id: category.id,
        index,
        radius: nodeRadius(),
        visualWidth: size.width,
        visualHeight: size.height,
        seed: index * 1.83 + 0.7,
        anchorX: anchor.x,
        anchorY: anchor.y,
        x: width * anchor.x,
        y: height * anchor.y,
      };
    });
    simNodesRef.current = new Map(simNodes.map((node) => [node.id, node]));
    const simulationLinks: SimLink[] = tideLinks.map((link) => ({
      id: link.id,
      source: link.sourceId,
      target: link.targetId,
      lengthRatio: link.lengthRatio,
    }));

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

    const linkDistance = (link: SimLink) => (isMobile ? 96 : 142) * link.lengthRatio;
    const linkForce = d3Force
      .forceLink<SimNode, SimLink>(simulationLinks)
      .id((node) => node.id)
      .distance(linkDistance)
      .strength(0.075);
    const xForce = d3Force.forceX<SimNode>((node) => width * node.anchorX).strength(0.007);
    const yForce = d3Force.forceY<SimNode>((node) => height * node.anchorY).strength(0.009);
    const collisionForce = d3Force
      .forceCollide<SimNode>()
      .radius((node) => node.radius + (isMobile ? 4 : 8))
      .iterations(2);
    const simulation = d3Force
      .forceSimulation<SimNode>(simNodes)
      .force("charge", d3Force.forceManyBody<SimNode>().strength(isMobile ? -92 : -142))
      .force("links", linkForce)
      .force("x", xForce)
      .force("y", yForce)
      .force("collision", collisionForce)
      .force(
        "current",
        createOceanCurrentForce((nodeId) => calmedIds.has(nodeId))
      )
      .force("boundary", boundaryForce)
      .velocityDecay(0.54)
      .alphaDecay(0.035)
      .alphaTarget(isReducedMotion ? 0 : 0.028);
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
      }
      for (const link of simulationLinks) {
        const source = typeof link.source === "object" ? link.source : null;
        const target = typeof link.target === "object" ? link.target : null;
        const element = linkElementsRef.current.get(link.id);
        if (!source || !target || !element) continue;
        element.setAttribute("x1", String(source.x ?? core.x));
        element.setAttribute("y1", String(source.y ?? core.y));
        element.setAttribute("x2", String(target.x ?? core.x));
        element.setAttribute("y2", String(target.y ?? core.y));
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
        calmedIdsRef.current.add(node.id);
        setDraggingId(node.id);
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
        calmedIdsRef.current.delete(node.id);
        setDraggingId(null);
        if (selectedIdRef.current !== node.id) {
          node.fx = null;
          node.fy = null;
        }
        if (!event.active) simulation.alphaTarget(isReducedMotion ? 0 : 0.028);
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
      xForce.x((node) => width * node.anchorX);
      yForce.y((node) => height * node.anchorY);
      linkForce.distance(linkDistance);
      collisionForce.radius((node) => node.radius + (isMobile ? 4 : 8));
      simulation.alpha(0.22).restart();
      updateVisuals();
    });
    resizeObserver.observe(stage);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !document.hidden) {
          simulation.alphaTarget(isReducedMotion ? 0 : 0.028).restart();
        } else {
          simulation.stop();
        }
      },
      { threshold: 0.08 }
    );
    intersectionObserver.observe(stage);

    const handleVisibility = () => {
      if (document.hidden) simulation.stop();
      else simulation.alphaTarget(isReducedMotion ? 0 : 0.028).restart();
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
      calmedIds.clear();
      panelRectRef.current = null;
    };
  }, [categories, tideLinks]);

  if (categories.length === 0) {
    return <p className="empty-signal knowledge-tide__empty">知识节点正在汇聚。</p>;
  }

  return (
    <div
      ref={rootRef}
      className="knowledge-tide"
      data-selected={selectedId ? "true" : "false"}
      data-dragging={draggingId ? "true" : "false"}
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
          {tideLinks.map((link) => {
            const touchesSelected = link.sourceId === selectedId || link.targetId === selectedId;
            const touchesDragging = link.sourceId === draggingId || link.targetId === draggingId;
            const touchesEmphasis =
              link.sourceId === emphasizedId || link.targetId === emphasizedId;
            const className = [
              touchesEmphasis ? "is-active" : "",
              touchesDragging ? "is-dragging" : "",
              touchesSelected ? "is-selected" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <line
                key={link.id}
                ref={(element) => {
                  if (element) linkElementsRef.current.set(link.id, element);
                  else linkElementsRef.current.delete(link.id);
                }}
                className={className || undefined}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {categories.map((category, index) => (
          <button
            key={category.id}
            ref={(element) => {
              if (element) nodeElementsRef.current.set(category.id, element);
              else nodeElementsRef.current.delete(category.id);
            }}
            type="button"
            className={[
              "knowledge-jelly",
              category.id === draggingId ? "is-dragging" : "",
              category.id === emphasizedId ? "is-emphasized" : "",
              emphasizedNeighbors.has(category.id) ? "is-neighbor" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-variant={(index % 3) + 1}
            aria-pressed={category.id === selectedId}
            aria-label={`${category.name}，${category.count} 篇文章`}
            onClick={(event) => {
              event.stopPropagation();
              selectCategory(category);
            }}
            onPointerEnter={() => {
              setHoveredId(category.id);
              calmNode(category.id);
            }}
            onPointerLeave={() => {
              setHoveredId((currentId) => (currentId === category.id ? null : currentId));
              releaseNode(category.id);
            }}
            onFocus={() => {
              setFocusedId(category.id);
              calmNode(category.id);
            }}
            onBlur={() => {
              setFocusedId((currentId) => (currentId === category.id ? null : currentId));
              releaseNode(category.id);
            }}
          >
            <span className="knowledge-jelly__halo" aria-hidden="true" />
            <Jellyfish />
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
