"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import type { HomeMilestone, HomeNews } from "../home.types";

type EchoPositionStyle = CSSProperties & {
  "--echo-x": string;
  "--echo-y": string;
};

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

function echoPosition(index: number, total: number): EchoPositionStyle {
  const progress = total <= 1 ? 0.5 : index / (total - 1);
  const radius = 62 - progress * 44;
  const angle = ((225 - progress * 25) * Math.PI) / 180;
  const x = 104 + Math.cos(angle) * radius;
  const y = 105 + Math.sin(angle) * radius;

  return {
    "--echo-x": `${x.toFixed(2)}%`,
    "--echo-y": `${y.toFixed(2)}%`,
  };
}

export function TimeEcho({ news, milestones }: { news: HomeNews[]; milestones: HomeMilestone[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const orderedMilestones = useMemo(
    () =>
      [...milestones].sort(
        (left, right) => new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime()
      ),
    [milestones]
  );
  const currentNews = news[pageIndex];

  const openLog = () => {
    setPageIndex(0);
    setIsOpen(true);
  };

  return (
    <div className="time-echo-content">
      <div className="echo-timeline" aria-label="科协大事记时间轴">
        <div className="echo-timeline__rings" aria-hidden="true" />
        {orderedMilestones.map((milestone, index) => (
          <article
            key={milestone.id}
            className={`echo-milestone ${index % 2 === 0 ? "is-even" : "is-odd"} ${
              index >= orderedMilestones.length / 2 ? "is-inner" : ""
            }`}
            style={echoPosition(index, orderedMilestones.length)}
          >
            <span className="echo-milestone__pulse" aria-hidden="true" />
            <div className="echo-milestone__copy">
              <time dateTime={milestone.occurredAt}>
                {formatDate(milestone.occurredAt, {
                  year: "numeric",
                  month: "2-digit",
                  timeZone: "UTC",
                })}
              </time>
              <strong>{milestone.title}</strong>
              <p>{milestone.description}</p>
            </div>
          </article>
        ))}
        {orderedMilestones.length === 0 && (
          <p className="echo-timeline__empty">大事记的第一圈回声仍在等待。</p>
        )}
      </div>

      {!isOpen ? (
        <button type="button" className="captains-log captains-log--closed" onClick={openLog}>
          <span className="captains-log__spine" aria-hidden="true" />
          <span className="captains-log__wear" aria-hidden="true" />
          <BookOpen size={24} strokeWidth={1.4} aria-hidden="true" />
          <small>900m · ARCHIVE</small>
          <strong>科协航海日志</strong>
          <span>点击展开最新新闻</span>
        </button>
      ) : (
        <div className="captains-log captains-log--open" aria-live="polite">
          <button
            type="button"
            className="captains-log__close"
            onClick={() => setIsOpen(false)}
            aria-label="合上航海日志"
            title="合上航海日志"
          >
            <X size={16} aria-hidden="true" />
          </button>

          <div className="captains-log__leaf captains-log__leaf--index">
            <span className="captains-log__stamp">YCKX · LOGBOOK</span>
            <div className="captains-log__index-number">
              <small>ENTRY</small>
              <strong>{news.length === 0 ? "00" : String(pageIndex + 1).padStart(2, "0")}</strong>
              <span>/ {String(news.length).padStart(2, "0")}</span>
            </div>
            <p>记录顺序</p>
            <b>最新</b>
            <i aria-hidden="true" />
            <b>往昔</b>
          </div>

          <article className="captains-log__leaf captains-log__leaf--entry">
            {currentNews ? (
              <>
                <div className="captains-log__entry-head">
                  <span>科协新闻 · 航行记录</span>
                  <time dateTime={currentNews.publishedAt ?? undefined}>
                    {formatDate(currentNews.publishedAt)}
                  </time>
                </div>
                <Link href={`/news/${currentNews.slug}`} className="captains-log__title">
                  {currentNews.title}
                </Link>
                <p className="captains-log__byline">撰稿人：{currentNews.authorName}</p>
                <p className="captains-log__excerpt">{currentNews.excerpt}</p>
                <div className="captains-log__entry-footer">
                  <Link href={`/news/${currentNews.slug}`}>
                    阅读完整新闻稿
                    <ExternalLink size={14} aria-hidden="true" />
                  </Link>
                  <span>{String(pageIndex + 1).padStart(2, "0")}</span>
                </div>
              </>
            ) : (
              <div className="captains-log__empty">
                <BookOpen size={28} strokeWidth={1.3} aria-hidden="true" />
                <strong>日志尚未写入新闻</strong>
                <p>发布第一篇“科协新闻”分类的文章后，它会出现在这里。</p>
              </div>
            )}
          </article>

          <div className="captains-log__controls">
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
