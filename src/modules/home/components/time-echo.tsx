"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, ChevronLeft, ChevronRight, ExternalLink, Newspaper, X } from "lucide-react";
import type { HomeMilestone, HomeNews, HomeSiteActivity } from "../home.types";
import { SiteActivityConsole } from "./site-activity-console";

type EchoMarker = HomeMilestone & {
  ring: number;
  tangentX: number;
  tangentY: number;
  x: number;
  y: number;
};

type EchoMarkerStyle = CSSProperties & {
  "--echo-x": string;
  "--echo-y": string;
};

type EchoRingStyle = CSSProperties & {
  "--ring-delay": string;
  "--ring-duration": string;
};

type Particle = {
  age: number;
  color: string;
  life: number;
  size: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

const ECHO_RINGS = [
  { capacity: 4, radiusX: 650, radiusY: 350, start: 196, end: 262 },
  { capacity: 3, radiusX: 545, radiusY: 293, start: 204, end: 258 },
  { capacity: 3, radiusX: 440, radiusY: 236, start: 194, end: 254 },
  { capacity: 2, radiusX: 335, radiusY: 179, start: 218, end: 258 },
] as const;

const PARTICLE_COLORS = ["221,248,250", "117,226,223", "117,174,232", "156,145,217", "242,198,109"];

function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return "日期待记录";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
    ...options,
  }).format(new Date(value));
}

function layoutMilestones(milestones: HomeMilestone[]): EchoMarker[] {
  let offset = 0;

  return ECHO_RINGS.flatMap((ring, ringIndex) => {
    const entries = milestones.slice(offset, offset + ring.capacity);
    offset += entries.length;

    return entries.map((milestone, entryIndex) => {
      const progress = entries.length === 1 ? 0.5 : entryIndex / (entries.length - 1);
      const angle = ring.start + (ring.end - ring.start) * progress;
      const radians = (angle * Math.PI) / 180;
      const x = 720 + Math.cos(radians) * ring.radiusX;
      const y = 440 + Math.sin(radians) * ring.radiusY;
      const rawTangentX = -ring.radiusX * Math.sin(radians);
      const rawTangentY = ring.radiusY * Math.cos(radians);
      const tangentLength = Math.hypot(rawTangentX, rawTangentY);

      return {
        ...milestone,
        ring: ringIndex,
        tangentX: rawTangentX / tangentLength,
        tangentY: rawTangentY / tangentLength,
        x: (x / 720) * 100,
        y: (y / 440) * 100,
      };
    });
  });
}

function markerStyle(marker: EchoMarker): EchoMarkerStyle {
  return {
    "--echo-x": `${marker.x.toFixed(2)}%`,
    "--echo-y": `${marker.y.toFixed(2)}%`,
  };
}

function EchoParticles({ marker }: { marker: EchoMarker | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markerRef = useRef<EchoMarker | null>(marker);
  const startAnimationRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    markerRef.current = marker;
    if (marker) startAnimationRef.current?.();
  }, [marker]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const particles: Particle[] = [];
    let frame = 0;
    let lastFrame = performance.now();
    let lastEmission = 0;
    let width = 1;
    let height = 1;
    let isVisible = !document.hidden;
    let isIntersecting = true;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const emit = (activeMarker: EchoMarker) => {
      const originX = (activeMarker.x / 100) * width;
      const originY = (activeMarker.y / 100) * height;

      for (let index = 0; index < 2 && particles.length < 70; index += 1) {
        const sinksInward = Math.random() < 0.24;
        const inwardX = width - originX;
        const inwardY = height - originY;
        const inwardLength = Math.max(1, Math.hypot(inwardX, inwardY));
        const directionX = sinksInward ? inwardX / inwardLength : activeMarker.tangentX;
        const directionY = sinksInward ? inwardY / inwardLength : activeMarker.tangentY;
        const speed = 24 + Math.random() * 34;

        particles.push({
          age: 0,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          life: 0.62 + Math.random() * 0.52,
          size: 0.8 + Math.random() * 1.7,
          vx: directionX * speed + (Math.random() - 0.5) * 13,
          vy: directionY * speed + (Math.random() - 0.5) * 13,
          x: originX + (Math.random() - 0.5) * 8,
          y: originY + (Math.random() - 0.5) * 8,
        });
      }
    };

    const draw = (time: number) => {
      frame = 0;
      const delta = Math.min((time - lastFrame) / 1000, 0.034);
      lastFrame = time;
      context.clearRect(0, 0, width, height);

      if (isVisible && !reducedMotion.matches && markerRef.current && time - lastEmission > 48) {
        emit(markerRef.current);
        lastEmission = time;
      }

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.age += delta;
        if (particle.age >= particle.life) {
          particles.splice(index, 1);
          continue;
        }

        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vx *= 0.985;
        particle.vy *= 0.985;
        const opacity = Math.sin((particle.age / particle.life) * Math.PI) * 0.82;

        context.beginPath();
        context.fillStyle = `rgba(${particle.color}, ${opacity.toFixed(3)})`;
        context.shadowBlur = 8;
        context.shadowColor = `rgba(${particle.color}, 0.55)`;
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }

      context.shadowBlur = 0;
      const shouldContinue =
        isVisible &&
        isIntersecting &&
        ((!reducedMotion.matches && width > 1 && height > 1 && markerRef.current !== null) ||
          particles.length > 0);
      if (shouldContinue) frame = window.requestAnimationFrame(draw);
    };

    const startAnimation = () => {
      if (frame || !isVisible || !isIntersecting) return;
      lastFrame = performance.now();
      frame = window.requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      if (isIntersecting) startAnimation();
    });
    const handleVisibility = () => {
      isVisible = !document.hidden;
      lastFrame = performance.now();
      if (isVisible) startAnimation();
    };

    resize();
    observer.observe(canvas);
    intersectionObserver.observe(canvas);
    startAnimationRef.current = startAnimation;
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      startAnimationRef.current = null;
      observer.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="echo-particles" aria-hidden="true" />;
}

export function TimeEcho({
  news,
  milestones,
  activity,
}: {
  news: HomeNews[];
  milestones: HomeMilestone[];
  activity: HomeSiteActivity;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [hoveredMilestoneId, setHoveredMilestoneId] = useState<string | null>(null);
  const [pinnedMilestoneId, setPinnedMilestoneId] = useState<string | null>(null);
  const orderedMilestones = useMemo(
    () =>
      [...milestones]
        .sort(
          (left, right) =>
            new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime()
        )
        .slice(0, 12),
    [milestones]
  );
  const echoMarkers = useMemo(() => layoutMilestones(orderedMilestones), [orderedMilestones]);
  const hoveredMarker = echoMarkers.find((marker) => marker.id === hoveredMilestoneId) ?? null;
  const activeMarker =
    hoveredMarker ??
    echoMarkers.find((marker) => marker.id === pinnedMilestoneId) ??
    echoMarkers.at(-1) ??
    null;
  const currentNews = news[pageIndex];

  const openArchive = () => {
    setPageIndex(0);
    setIsOpen(true);
  };

  return (
    <div className="time-echo-content">
      <div className="echo-timeline" aria-label="科协大事记时间轴">
        <svg className="echo-timeline__rings" viewBox="0 0 720 440" aria-hidden="true">
          <defs>
            <linearGradient id="echo-flow-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ddf8fa" />
              <stop offset="0.3" stopColor="#75e2df" />
              <stop offset="0.58" stopColor="#75aee8" />
              <stop offset="0.82" stopColor="#9c91d9" />
              <stop offset="1" stopColor="#f2c66d" />
            </linearGradient>
          </defs>
          {ECHO_RINGS.map((ring, index) => (
            <g key={ring.radiusX}>
              <ellipse
                className="echo-ring echo-ring--base"
                cx="720"
                cy="440"
                rx={ring.radiusX}
                ry={ring.radiusY}
              />
              <ellipse
                className="echo-ring echo-ring--flow"
                cx="720"
                cy="440"
                rx={ring.radiusX}
                ry={ring.radiusY}
                pathLength="100"
                style={
                  {
                    "--ring-delay": `${index * -2.2}s`,
                    "--ring-duration": `${11 + index * 1.4}s`,
                  } as EchoRingStyle
                }
              />
            </g>
          ))}
        </svg>

        <EchoParticles marker={hoveredMarker} />

        {activeMarker && (
          <>
            <svg className="echo-readout__connector" viewBox="0 0 720 440" aria-hidden="true">
              <polyline
                points={`${activeMarker.x * 7.2},${activeMarker.y * 4.4} ${Math.max(
                  150,
                  activeMarker.x * 7.2 - 62
                )},${Math.max(58, activeMarker.y * 4.4 - 38)} 104,44`}
              />
            </svg>
            <article className="echo-readout" aria-live="polite">
              <span>回声读数 · RING {String(activeMarker.ring + 1).padStart(2, "0")}</span>
              <time dateTime={activeMarker.occurredAt}>
                {formatDate(activeMarker.occurredAt, {
                  year: "numeric",
                  month: "2-digit",
                  timeZone: "UTC",
                })}
              </time>
              <strong>{activeMarker.title}</strong>
              <p>{activeMarker.description}</p>
            </article>
          </>
        )}

        {echoMarkers.map((marker) => (
          <button
            key={marker.id}
            type="button"
            className={`echo-marker ${activeMarker?.id === marker.id ? "is-active" : ""} ${
              marker.x > 82 ? "is-right-edge" : ""
            }`}
            style={markerStyle(marker)}
            onClick={() =>
              setPinnedMilestoneId((current) => (current === marker.id ? null : marker.id))
            }
            onMouseEnter={() => setHoveredMilestoneId(marker.id)}
            onMouseLeave={() => setHoveredMilestoneId(null)}
            onFocus={() => setHoveredMilestoneId(marker.id)}
            onBlur={() => setHoveredMilestoneId(null)}
            aria-pressed={pinnedMilestoneId === marker.id}
            aria-label={`${formatDate(marker.occurredAt, {
              year: "numeric",
              month: "2-digit",
              timeZone: "UTC",
            })}，${marker.title}`}
          >
            <span className="echo-marker__pulse" aria-hidden="true" />
            <time dateTime={marker.occurredAt}>
              {formatDate(marker.occurredAt, {
                year: "numeric",
                month: "2-digit",
                timeZone: "UTC",
              })}
            </time>
          </button>
        ))}

        {echoMarkers.length === 0 && (
          <p className="echo-timeline__empty">大事记的第一圈回声仍在等待。</p>
        )}
      </div>

      {!isOpen ? (
        <>
          <button
            type="button"
            className="archive-folder archive-folder--closed"
            onClick={openArchive}
          >
            <span className="archive-folder__spine" aria-hidden="true" />
            <span className="archive-folder__wear" aria-hidden="true" />
            <i className="archive-folder__corner archive-folder__corner--top" aria-hidden="true" />
            <i
              className="archive-folder__corner archive-folder__corner--bottom"
              aria-hidden="true"
            />
            <Archive size={23} strokeWidth={1.35} aria-hidden="true" />
            <small>900m · YCKX ARCHIVE</small>
            <strong>科协档案夹</strong>
            <span>打开并读取最新新闻</span>
          </button>
          <SiteActivityConsole activity={activity} />
        </>
      ) : (
        <div className="archive-folder archive-folder--open" aria-live="polite">
          <div className="archive-folder__shell" aria-hidden="true">
            <span>科协档案夹</span>
          </div>

          <button
            type="button"
            className="archive-folder__close"
            onClick={() => setIsOpen(false)}
            aria-label="合上科协档案夹"
            title="合上档案夹"
          >
            <X size={16} aria-hidden="true" />
          </button>

          <aside className="archive-folder__rail" aria-label="新闻档案顺序">
            <span>YCKX · NEWS FILE</span>
            <div>
              <small>ENTRY</small>
              <strong>{news.length === 0 ? "00" : String(pageIndex + 1).padStart(2, "0")}</strong>
              <b>/ {String(news.length).padStart(2, "0")}</b>
            </div>
            <p>由新至旧</p>
            {currentNews && (
              <dl>
                <div>
                  <dt>DATE</dt>
                  <dd>{formatDate(currentNews.publishedAt)}</dd>
                </div>
                <div>
                  <dt>AUTHOR</dt>
                  <dd>{currentNews.authorName}</dd>
                </div>
              </dl>
            )}
          </aside>

          <article key={currentNews?.id ?? "empty"} className="archive-sheet">
            <span className="archive-sheet__clip" aria-hidden="true" />
            {currentNews ? (
              <>
                <div className="archive-sheet__head">
                  <span>科协新闻 · 存档副本</span>
                  <time dateTime={currentNews.publishedAt ?? undefined}>
                    {formatDate(currentNews.publishedAt)}
                  </time>
                </div>
                <Link href={`/news/${currentNews.slug}`} className="archive-sheet__title">
                  {currentNews.title}
                </Link>
                <p className="archive-sheet__byline">撰稿人：{currentNews.authorName}</p>
                <p className="archive-sheet__excerpt">{currentNews.excerpt}</p>
                <div className="archive-sheet__footer">
                  <Link href={`/news/${currentNews.slug}`}>
                    阅读完整新闻稿
                    <ExternalLink size={14} aria-hidden="true" />
                  </Link>
                  <span>FILE {String(pageIndex + 1).padStart(2, "0")}</span>
                </div>
              </>
            ) : (
              <div className="archive-sheet__empty">
                <Newspaper size={28} strokeWidth={1.3} aria-hidden="true" />
                <strong>档案夹中还没有新闻</strong>
                <p>发布第一篇“科协新闻”分类的文章后，它会出现在这里。</p>
              </div>
            )}
          </article>

          <nav className="archive-folder__register" aria-label="选择新闻档案">
            <header>
              <span>档案目录</span>
              <small>INDEX / {String(news.length).padStart(2, "0")}</small>
            </header>
            {news.length === 0 ? (
              <p>等待第一份新闻档案。</p>
            ) : (
              news.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={index === pageIndex ? "is-active" : ""}
                  onClick={() => setPageIndex(index)}
                  aria-label={`查看第 ${index + 1} 条新闻：${item.title}`}
                  title={item.title}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.title}</strong>
                  <time dateTime={item.publishedAt ?? undefined}>
                    {formatDate(item.publishedAt, {
                      year: "2-digit",
                      month: "2-digit",
                    })}
                  </time>
                </button>
              ))
            )}
          </nav>

          <div className="archive-folder__controls">
            <button
              type="button"
              onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
              disabled={pageIndex === 0 || news.length === 0}
              aria-label="查看更新的新闻"
              title="上一页"
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <Link href="/news">进入科协新闻</Link>
            <button
              type="button"
              onClick={() => setPageIndex((current) => Math.min(news.length - 1, current + 1))}
              disabled={pageIndex >= news.length - 1 || news.length === 0}
              aria-label="查看更早的新闻"
              title="下一页"
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
