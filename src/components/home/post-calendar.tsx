"use client";

import { useState, useMemo } from "react";

interface PostDate {
  date: string; // "YYYY-MM-DD"
  slug: string;
  title: string;
}

interface Props {
  posts: PostDate[];
  onSelectDate?: (date: string) => void;
}

/** 简洁日历小组件，标记有文章的日期，点击高亮 */
export function PostCalendar({ posts, onSelectDate }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based
  const [selected, setSelected] = useState<string | null>(null);

  // 构建有文章的日期集合
  const postDays = useMemo(() => {
    const set = new Set<string>();
    for (const p of posts) set.add(p.date.slice(0, 10));
    return set;
  }, [posts]);

  // 本月文章列表
  const monthPosts = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return posts.filter((p) => p.date.startsWith(prefix));
  }, [posts, year, month]);

  // 日历网格
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const weeks: (number | null)[][] = [];
  let day = 1;
  for (let w = 0; w < 6 && day <= daysInMonth; w++) {
    const week: (number | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if ((w === 0 && d < firstDayOfWeek) || day > daysInMonth) {
        week.push(null);
      } else {
        week.push(day++);
      }
    }
    weeks.push(week);
  }

  const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const handleDateClick = (dayNum: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    setSelected(dateStr);
    onSelectDate?.(dateStr);
  };

  return (
    <div className="font-[family-name:var(--font-sans)]">
      {/* 月份切换 */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="text-xs text-[#8b5e3c] hover:text-[#5a3a22] px-1">‹</button>
        <span className="text-sm font-bold text-[#1a1a1a]">{year}年 {month + 1}月</span>
        <button onClick={nextMonth} className="text-xs text-[#8b5e3c] hover:text-[#5a3a22] px-1">›</button>
      </div>

      {/* 日期表头 */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {dayNames.map((n) => (
          <div key={n} className="text-center text-[10px] text-[#6b6b6b] py-0.5">{n}</div>
        ))}
      </div>

      {/* 日期格子 */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-px">
          {week.map((d, di) => {
            if (d === null) return <div key={di} className="aspect-square" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const hasPost = postDays.has(dateStr);
            const isSel = selected === dateStr;
            const isToday = dateStr === today.toISOString().slice(0, 10);
            return (
              <button
                key={di}
                className={`aspect-square flex items-center justify-center text-xs rounded-sm transition-colors
                  ${isSel ? "bg-[#8b5e3c] text-white" : hasPost ? "bg-[#f0ebe0] text-[#8b5e3c] font-bold" : "text-[#6b6b6b] hover:bg-[#f5f0e8]"}
                  ${isToday && !isSel ? "ring-1 ring-[#8b5e3c]" : ""}`}
                onClick={() => hasPost && handleDateClick(d)}
                disabled={!hasPost}
                title={hasPost ? "有文章" : undefined}
              >
                {d}
              </button>
            );
          })}
        </div>
      ))}

      {/* 选中日期的文章列表 */}
      {selected && monthPosts.filter(p => p.date.startsWith(selected)).length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#e8e0d5] space-y-1 max-h-28 overflow-y-auto">
          {monthPosts.filter(p => p.date.startsWith(selected)).slice(0, 3).map((p) => (
            <a key={p.slug} href={`/events/${p.slug}`} className="block text-xs text-[#8b5e3c] hover:text-[#5a3a22] truncate">
              {p.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
