"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { PostCard } from "@/components/article/post-card";
import { PostCalendar } from "@/components/home/post-calendar";
import type { PostCardData } from "@/components/article/post-card";

interface CalendarPost {
  date: string;
  slug: string;
  title: string;
}

interface Props {
  featuredPosts: PostCardData[];
  calendarPosts: CalendarPost[];
  allPosts: PostCardData[]; // 用于按日期筛选
}

/** 从数组中随机取 n 个不重复元素 */
function randomPick<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return [...arr];
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

/** 控制展示卡片数量，保证不溢出视口 */
function visibleCount(): number {
  // S1 可用高度 ≈ 100vh - header(56px) - padding(64px) - B1(~100px) - B3(~50px) - SectionHeading(~40px) - 日历(~300px)
  // 保守估计每张卡片约 100px
  return 4;
}

export function ArticleShowcase({ featuredPosts, calendarPosts, allPosts }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [seed, setSeed] = useState(0); // 换一批触发器
  const [mounted, setMounted] = useState(false);
  const limit = visibleCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 默认模式：服务端/首次渲染取前 N 篇（确定性），客户端水合后执行随机选取
  const featuredDisplay = useMemo(() => {
    if (!mounted) return featuredPosts.slice(0, limit);
    return randomPick(featuredPosts, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredPosts, seed, mounted]);

  // 日期选中模式：该日期的文章
  const dateFilteredPosts = useMemo(() => {
    if (!selectedDate) return [];
    return allPosts.filter((p) => {
      if (!p.publishedAt) return false;
      const d = new Date(p.publishedAt);
      return d.toISOString().slice(0, 10) === selectedDate;
    });
  }, [allPosts, selectedDate]);

  // 当前展示的文章
  const isDateMode = selectedDate !== null;
  const displayPosts = isDateMode ? dateFilteredPosts.slice(0, limit) : featuredDisplay;

  const handleDateSelect = useCallback((date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null); // 再次点击取消
    } else {
      setSelectedDate(date);
    }
  }, [selectedDate]);

  const handleRefresh = useCallback(() => {
    setSeed((s) => s + 1);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：文章展示区 */}
      <div className="lg:col-span-2">
        <div className="flex items-end justify-between mb-5 pb-2.5 border-b border-[#e8e0d5]">
          <h2 className="text-lg font-bold text-[#1a1a1a] tracking-wide">
            {isDateMode ? `${selectedDate} 发表的文章` : "精选文章"}
          </h2>
          <div className="flex items-center gap-3">
            {isDateMode && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-[#6b6b6b] hover:text-[#8b5e3c] font-[family-name:var(--font-sans)]"
              >
                返回精选
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="text-xs text-[#8b5e3c] hover:text-[#5a3a22] font-[family-name:var(--font-sans)]"
            >
              换一批 ↻
            </button>
          </div>
        </div>

        {displayPosts.length === 0 ? (
          <p className="text-[#6b6b6b] text-sm font-[family-name:var(--font-sans)]">
            {isDateMode ? "该日期没有发表的文章。" : "暂无精选文章。"}
          </p>
        ) : (
          <div className="space-y-3">
            {displayPosts.map((post) => (
              <PostCard key={post.id} post={post} showExcerpt />
            ))}
          </div>
        )}
      </div>

      {/* 右侧：日历 */}
      <div className="lg:col-span-1">
        <div className="card">
          <PostCalendar posts={calendarPosts} onSelectDate={handleDateSelect} />
        </div>
      </div>
    </div>
  );
}
