import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export default async function EventsPage() {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      category: { type: "EVENT" },
    },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const columns = await prisma.column.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { sortOrder: "asc" },
  });

  // 按年份分组
  const grouped = new Map<number, typeof posts>();
  for (const p of posts) {
    const year = p.createdAt.getFullYear();
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year)!.push(p);
  }
  const sortedYears = [...grouped.keys()].sort((a, b) => b - a);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">工作日志与大事记</h1>

      {/* 专栏入口 */}
      {columns.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6 mt-4">
          {columns.map((col) => (
            <Link key={col.id} href={`/events/columns/${col.slug}`} className="btn-primary">
              {col.title} ({col._count.posts})
            </Link>
          ))}
        </div>
      )}

      {/* 年份快速跳转 */}
      {sortedYears.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8 font-[family-name:var(--font-sans)]">
          {sortedYears.map((year) => (
            <a
              key={year}
              href={`#year-${year}`}
              className="text-sm px-3 py-1 rounded-full border border-[#e8e0d5] text-[#6b6b6b] hover:text-[#8b5e3c] hover:border-[#c4a882] hover:bg-[#faf7f2] transition-colors"
            >
              {year}
            </a>
          ))}
        </div>
      )}

      {/* 时间线 */}
      {[...grouped.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([year, items]) => (
          <section key={year} id={`year-${year}`} className="mb-8 scroll-mt-20">
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4 sticky top-14 bg-[#fdfcf9] py-2 z-10">
              {year}
            </h2>
            <div className="relative border-l-2 border-[#e8e0d5] ml-3 pl-6 space-y-5">
              {items.map((post) => (
                <div key={post.id} className="relative">
                  <span className="absolute -left-[29px] top-1.5 w-3 h-3 bg-[#c4a882] rounded-full" />
                  <Link href={`/events/${post.slug}`} className="block card group">
                    <time className="text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)]">
                      {post.createdAt.toLocaleDateString("zh-CN")}
                    </time>
                    <h3 className="text-base font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors mt-1">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-[#6b6b6b] line-clamp-2 mt-1 font-[family-name:var(--font-sans)]">
                        {post.excerpt}
                      </p>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}

      {posts.length === 0 && <p className="text-[#6b6b6b]">暂无大事记。</p>}
    </div>
  );
}
