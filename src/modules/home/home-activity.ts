import type { HomeActivityPoint, HomeSectionStat, HomeSiteActivity } from "./home.types";

const DAY_MS = 24 * 60 * 60 * 1000;
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

const SECTION_DEFINITIONS = [
  ["KNOWLEDGE", "知识库"],
  ["COMPETITION", "竞赛中心"],
  ["NEWS", "科协新闻"],
  ["EVENT", "活动记录"],
  ["COLUMN", "专栏"],
  ["ROUTINE", "科协日常"],
] as const;

type ActivityTotals = Pick<
  HomeSiteActivity,
  "totalPosts" | "totalCategories" | "totalMembers" | "totalViews"
>;

function calendarKey(year: number, monthIndex: number, day?: number): string {
  const month = String(monthIndex + 1).padStart(2, "0");
  return day === undefined
    ? `${year}-${month}`
    : `${year}-${month}-${String(day).padStart(2, "0")}`;
}

function shanghaiParts(date: Date): { year: number; monthIndex: number; day: number } {
  const shifted = new Date(date.getTime() + SHANGHAI_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function dayKey(date: Date): string {
  const parts = shanghaiParts(date);
  return calendarKey(parts.year, parts.monthIndex, parts.day);
}

function monthKey(date: Date): string {
  const parts = shanghaiParts(date);
  return calendarKey(parts.year, parts.monthIndex);
}

function createDailySeries(
  counts: Map<string, number>,
  todayCalendarTime: number,
  days: number
): HomeActivityPoint[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(todayCalendarTime - (days - index - 1) * DAY_MS);
    const year = date.getUTCFullYear();
    const monthIndex = date.getUTCMonth();
    const day = date.getUTCDate();
    const key = calendarKey(year, monthIndex, day);

    return {
      key,
      label: `${monthIndex + 1}/${day}`,
      count: counts.get(key) ?? 0,
    };
  });
}

function createMonthlySeries(
  counts: Map<string, number>,
  currentYear: number,
  currentMonthIndex: number
): HomeActivityPoint[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(currentYear, currentMonthIndex - (11 - index), 1));
    const year = date.getUTCFullYear();
    const monthIndex = date.getUTCMonth();
    const key = calendarKey(year, monthIndex);

    return {
      key,
      label: `${monthIndex + 1}月`,
      count: counts.get(key) ?? 0,
    };
  });
}

export function buildActivitySeries(
  publishedDates: Array<Date | null>,
  now = new Date()
): HomeSiteActivity["series"] {
  const dailyCounts = new Map<string, number>();
  const monthlyCounts = new Map<string, number>();

  for (const publishedAt of publishedDates) {
    if (!publishedAt) continue;
    const dailyKey = dayKey(publishedAt);
    const monthlyKey = monthKey(publishedAt);
    dailyCounts.set(dailyKey, (dailyCounts.get(dailyKey) ?? 0) + 1);
    monthlyCounts.set(monthlyKey, (monthlyCounts.get(monthlyKey) ?? 0) + 1);
  }

  const current = shanghaiParts(now);
  const todayCalendarTime = Date.UTC(current.year, current.monthIndex, current.day);

  return {
    week: createDailySeries(dailyCounts, todayCalendarTime, 7),
    month: createDailySeries(dailyCounts, todayCalendarTime, 30),
    year: createMonthlySeries(monthlyCounts, current.year, current.monthIndex),
  };
}

export function buildSectionStats(
  categories: Array<{ type: string; posts: number }>
): HomeSectionStat[] {
  const totals = new Map<string, { categories: number; posts: number }>();

  for (const category of categories) {
    const current = totals.get(category.type) ?? { categories: 0, posts: 0 };
    current.categories += 1;
    current.posts += category.posts;
    totals.set(category.type, current);
  }

  return SECTION_DEFINITIONS.map(([type, label]) => ({
    type,
    label,
    categories: totals.get(type)?.categories ?? 0,
    posts: totals.get(type)?.posts ?? 0,
  }));
}

export function createHomeSiteActivity(
  totals: ActivityTotals,
  categories: Array<{ type: string; posts: number }>,
  publishedDates: Array<Date | null>,
  now = new Date()
): HomeSiteActivity {
  return {
    ...totals,
    sections: buildSectionStats(categories),
    series: buildActivitySeries(publishedDates, now),
  };
}
