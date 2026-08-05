"use client";

import { useMemo, useState } from "react";
import { Eye, FolderTree, Radio, Users } from "lucide-react";
import { ACTIVITY_CHART as CHART, activityChartIndexFromClientX } from "../activity-chart-geometry";
import type { HomeActivityPoint, HomeSiteActivity } from "../home.types";

type Period = keyof HomeSiteActivity["series"];

const PERIODS: Array<{ key: Period; label: string; description: string }> = [
  { key: "week", label: "周", description: "最近 7 天" },
  { key: "month", label: "月", description: "最近 30 天" },
  { key: "year", label: "年", description: "最近 12 个月" },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  );
}

function createChart(points: HomeActivityPoint[]) {
  const plotWidth = CHART.width - CHART.left - CHART.right;
  const plotHeight = CHART.height - CHART.top - CHART.bottom;
  const maximum = Math.max(1, ...points.map((point) => point.count));
  const coordinates = points.map((point, index) => ({
    ...point,
    x:
      points.length <= 1
        ? CHART.left + plotWidth / 2
        : CHART.left + (index / (points.length - 1)) * plotWidth,
    y: CHART.top + plotHeight - (point.count / maximum) * plotHeight,
  }));

  return {
    coordinates,
    maximum,
    path: coordinates
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
      .join(" "),
  };
}

function xTickIndexes(length: number): number[] {
  if (length <= 12) return Array.from({ length }, (_, index) => index);
  return [0, 5, 11, 17, 23, length - 1];
}

export function SiteActivityConsole({ activity }: { activity: HomeSiteActivity }) {
  const [period, setPeriod] = useState<Period>("month");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const points = activity.series[period];
  const chart = useMemo(() => createChart(points), [points]);
  const activeIndex = hoveredIndex ?? Math.max(0, points.length - 1);
  const activePoint = chart.coordinates[activeIndex];
  const periodMeta = PERIODS.find((item) => item.key === period) ?? PERIODS[1];
  const periodTotal = points.reduce((sum, point) => sum + point.count, 0);
  const peak = Math.max(0, ...points.map((point) => point.count));
  const plotHeight = CHART.height - CHART.top - CHART.bottom;
  const yIntervals = Math.min(4, chart.maximum);

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setHoveredIndex(activityChartIndexFromClientX(event.clientX, bounds, points.length));
  };

  return (
    <section className="site-activity-console" aria-labelledby="site-activity-title">
      <header className="site-activity-console__header">
        <div>
          <Radio size={16} strokeWidth={1.5} aria-hidden="true" />
          <span>发表信号观测台</span>
          <small id="site-activity-title">PUBLISHING SIGNAL</small>
        </div>
        <div className="site-activity-console__periods" aria-label="选择文章统计周期">
          {PERIODS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={period === item.key ? "is-active" : ""}
              onClick={() => {
                setPeriod(item.key);
                setHoveredIndex(null);
              }}
              aria-pressed={period === item.key}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="site-activity-console__summary">
        <div className="site-activity-console__total">
          <small>已发布文章</small>
          <strong>{String(activity.totalPosts).padStart(3, "0")}</strong>
          <span>ALL FILES</span>
        </div>
        <dl>
          <div>
            <FolderTree size={14} aria-hidden="true" />
            <dt>分类</dt>
            <dd>{activity.totalCategories}</dd>
          </div>
          <div>
            <Users size={14} aria-hidden="true" />
            <dt>成员</dt>
            <dd>{activity.totalMembers}</dd>
          </div>
          <div>
            <Eye size={14} aria-hidden="true" />
            <dt>浏览</dt>
            <dd>{formatNumber(activity.totalViews)}</dd>
          </div>
        </dl>
      </div>

      <div className="site-activity-console__sections" aria-label="各板块内容统计">
        {activity.sections.map((section) => (
          <div key={section.type}>
            <span>{section.label}</span>
            <strong>{section.posts}</strong>
            <small>{section.categories} 类</small>
          </div>
        ))}
      </div>

      <div className="site-activity-chart">
        <div className="site-activity-chart__readout" aria-live="polite">
          <span>{periodMeta.description}</span>
          <strong>{periodTotal}</strong>
          <small>篇发布 · 峰值 {peak}</small>
          {activePoint && (
            <b>
              {activePoint.label} / {activePoint.count} 篇
            </b>
          )}
        </div>

        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          role="img"
          aria-label={`${periodMeta.description}文章发布折线图，共发布 ${periodTotal} 篇，峰值 ${peak} 篇`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredIndex(null)}
        >
          {Array.from({ length: yIntervals + 1 }, (_, index) => {
            const ratio = index / yIntervals;
            const y = CHART.top + plotHeight * ratio;
            const value = Math.round(chart.maximum * (1 - ratio));
            return (
              <g key={`horizontal-${index}`}>
                <line
                  className="site-activity-chart__grid"
                  x1={CHART.left}
                  x2={CHART.width - CHART.right}
                  y1={y}
                  y2={y}
                />
                <text className="site-activity-chart__axis" x={CHART.left - 11} y={y + 3}>
                  {value}
                </text>
              </g>
            );
          })}

          {xTickIndexes(points.length).map((index) => {
            const point = chart.coordinates[index];
            if (!point) return null;
            return (
              <g key={point.key}>
                <line
                  className="site-activity-chart__grid site-activity-chart__grid--vertical"
                  x1={point.x}
                  x2={point.x}
                  y1={CHART.top}
                  y2={CHART.height - CHART.bottom}
                />
                <text
                  className="site-activity-chart__axis site-activity-chart__axis--x"
                  x={point.x}
                  y={CHART.height - 12}
                >
                  {point.label}
                </text>
              </g>
            );
          })}

          <path className="site-activity-chart__line" d={chart.path} />

          {chart.coordinates.map((point, index) => (
            <circle
              key={point.key}
              className={`site-activity-chart__point ${index === activeIndex ? "is-active" : ""}`}
              cx={point.x}
              cy={point.y}
              r={index === activeIndex ? 4.2 : 2.2}
            />
          ))}

          {activePoint && (
            <line
              className="site-activity-chart__cursor"
              x1={activePoint.x}
              x2={activePoint.x}
              y1={CHART.top}
              y2={CHART.height - CHART.bottom}
            />
          )}
        </svg>

        <ol className="site-activity-console__data">
          {points.map((point) => (
            <li key={point.key}>
              {point.label}：{point.count} 篇
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
