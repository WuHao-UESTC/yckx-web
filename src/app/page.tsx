import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/article/post-card";
import { LazySection } from "@/components/shared/lazy-section";
import { ImageCarousel } from "@/components/home/image-carousel";
import { PostCalendar } from "@/components/home/post-calendar";
import { KnowledgeGraphCanvas } from "@/components/home/knowledge-graph-canvas";
import type { GraphNode, GraphLink } from "@/components/home/knowledge-graph";

// ══════════════════════════════════════════════════════
// 数据获取
// ══════════════════════════════════════════════════════
async function getHomeData() {
  const [
    featuredPosts,
    latestPosts,
    recentPhotos,
    recentEvents,
    calendarPosts,
    categories,
    stickyNotes,
    newsHeadline,
  ] = await Promise.all([
    // 精选文章
    prisma.post.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    // 最新文章
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    // 轮播图片（照片墙取最新 5 张）
    prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // 大事记
    prisma.post.findMany({
      where: { status: "PUBLISHED", category: { type: "EVENT" } },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    // 日历数据：所有已发布文章（带日期）
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, title: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 200,
    }),
    // 分类（用于知识图谱）
    prisma.category.findMany({
      include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } },
      orderBy: { sortOrder: "asc" },
    }),
    // 吐槽便签
    prisma.stickyNote.findMany({
      include: { author: { select: { displayName: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // 头条新闻：最新的事件/新闻文章
    prisma.post.findFirst({
      where: { status: "PUBLISHED", category: { type: "EVENT" } },
      include: { author: { select: { displayName: true, username: true } }, category: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  return { featuredPosts, latestPosts, recentPhotos, recentEvents, calendarPosts, categories, stickyNotes, newsHeadline };
}

// ══════════════════════════════════════════════════════
// 知识图谱数据构建
// ══════════════════════════════════════════════════════
function buildGraphData(categories: Awaited<ReturnType<typeof getHomeData>>["categories"]): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // 两个主节点
  nodes.push({ id: "competition-main", label: "竞赛", type: "main", categorySlug: undefined, radius: 30 });
  nodes.push({ id: "knowledge-main", label: "知识库", type: "main", categorySlug: undefined, radius: 30 });

  for (const cat of categories) {
    if (cat._count.posts === 0) continue;
    const isCompetition = cat.type === "COMPETITION";
    const isKnowledge = cat.type === "KNOWLEDGE";
    if (!isCompetition && !isKnowledge) continue;

    const nodeId = `cat-${cat.slug}`;
    nodes.push({
      id: nodeId,
      label: cat.name,
      type: "category",
      categorySlug: cat.slug,
      radius: 18 + Math.min(cat._count.posts * 2, 14),
    });
    links.push({
      source: isCompetition ? "competition-main" : "knowledge-main",
      target: nodeId,
    });
  }

  return { nodes, links };
}

// ══════════════════════════════════════════════════════
// 区块标题
// ══════════════════════════════════════════════════════
function SectionHeading({ children, href, moreLabel }: { children: React.ReactNode; href?: string; moreLabel?: string }) {
  return (
    <div className="flex items-end justify-between mb-5 pb-2.5 border-b border-[#e8e0d5]">
      <h2 className="text-lg font-bold text-[#1a1a1a] tracking-wide">{children}</h2>
      {href && (
        <Link href={href} className="text-xs text-[#8b5e3c] hover:text-[#5a3a22] font-[family-name:var(--font-sans)]">
          {moreLabel ?? "查看全部"} →
        </Link>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 便签配色
// ══════════════════════════════════════════════════════
const NOTE_COLORS = [
  "bg-[#fef9e7]",
  "bg-[#fdedec]",
  "bg-[#ebf5fb]",
  "bg-[#eafaf1]",
  "bg-[#f4ecf7]",
];

// ══════════════════════════════════════════════════════
// 主页
// ══════════════════════════════════════════════════════
export default async function Home() {
  const { featuredPosts, latestPosts, recentPhotos, recentEvents, calendarPosts, categories, stickyNotes, newsHeadline } = await getHomeData();
  const graphData = buildGraphData(categories);

  // 日历数据格式化
  const calPosts = calendarPosts
    .filter((p) => p.publishedAt)
    .map((p) => ({
      date: p.publishedAt!.toISOString(),
      slug: p.slug,
      title: p.title,
    }));

  // 轮播图数据
  const carouselImages = recentPhotos.map((p) => ({
    src: p.imagePath,
    alt: p.caption ?? "科协照片",
    caption: p.caption ?? undefined,
  }));
  return (
    <>
      {/* ════════════════════════════════════════════════ */}
      {/* 第一部分：整体展示区                                 */}
      {/* ════════════════════════════════════════════════ */}
      <section className="paper-texture border-b border-[#e8e0d5]">
        <div className="mx-auto max-w-[1160px] px-5 py-8">

          {/* Row 1: LOGO + 标语 | 轮播图 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 左：LOGO 与标语 */}
            <div className="flex flex-col items-center justify-center min-h-[220px] text-center px-6">
              <div className="w-24 h-24 rounded-full bg-[#f5f0e8] flex items-center justify-center mb-4 border-2 border-[#e8e0d5]">
                <span className="text-3xl font-bold text-[#8b5e3c] tracking-widest">科协</span>
              </div>
              <h1 className="text-3xl font-bold text-[#1a1a1a] mb-3 tracking-wide">英才科协</h1>
              <p className="text-sm text-[#8b5e3c] tracking-[0.25em] font-[family-name:var(--font-sans)]">
                自由 · 创新 · 博学 · 精进
              </p>
            </div>
            {/* 右：轮播图 */}
            <div className="min-h-[220px]">
              <ImageCarousel images={carouselImages} interval={3500} />
            </div>
          </div>

          {/* Row 2: 导航栏 — 由全局 SiteHeader 承担，此处省略 */}
          {/* （导航已经在 layout.tsx 中作为 sticky header 存在） */}

          {/* Row 3: 最新文章(左宽) | 日历(右窄) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：最新文章卡片 */}
            <div className="lg:col-span-2">
              <SectionHeading>最新文章</SectionHeading>
              {latestPosts.length === 0 ? (
                <p className="text-[#6b6b6b] text-sm font-[family-name:var(--font-sans)]">还没有文章发布。</p>
              ) : (
                <div className="space-y-3">
                  {latestPosts.map((post) => (
                    <PostCard key={post.id} post={post} showExcerpt />
                  ))}
                </div>
              )}
            </div>
            {/* 右侧：日历组件 */}
            <div className="lg:col-span-1">
              <div className="card">
                <PostCalendar posts={calPosts} />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 第二部分：知识库与竞赛区                             */}
      {/* ════════════════════════════════════════════════ */}
      <section className="border-b border-[#e8e0d5] bg-white">
        <div className="mx-auto max-w-[1160px] px-5 py-10">
          <SectionHeading>知识库与竞赛</SectionHeading>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：知识图谱 */}
            <div className="card min-h-[420px] flex flex-col">
              <p className="text-xs text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
                分类关系图谱 — 点击节点查看详情
              </p>
              <div className="flex-1">
                <KnowledgeGraphCanvas
                  nodes={graphData.nodes}
                  links={graphData.links}
                />
              </div>
            </div>
            {/* 右侧：详情面板 — 由 KnowledgeGraphCanvas 内部联动 */}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 第三部分：科协新闻与日常                             */}
      {/* ════════════════════════════════════════════════ */}
      <section className="paper-texture">
        <div className="mx-auto max-w-[1160px] px-5 py-10">

          {/* Row 1: 新闻头条大图 */}
          {newsHeadline && (
            <LazySection className="mb-10">
              <SectionHeading href="/events">科协新闻</SectionHeading>
              <Link href={`/events/${newsHeadline.slug}`}
                className="block card group overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {newsHeadline.coverImage && (
                    <div className="w-full sm:w-48 shrink-0 rounded-md overflow-hidden bg-[#f5f0e8]">
                      <img src={newsHeadline.coverImage} alt={newsHeadline.title}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors mb-2">
                      {newsHeadline.title}
                    </h3>
                    {newsHeadline.excerpt && (
                      <p className="text-sm text-[#6b6b6b] line-clamp-3 font-[family-name:var(--font-sans)]">
                        {newsHeadline.excerpt}
                      </p>
                    )}
                    <p className="text-xs text-[#6b6b6b] mt-3 font-[family-name:var(--font-sans)]">
                      {newsHeadline.author.displayName ?? newsHeadline.author.username}
                      {" · "}
                      {newsHeadline.publishedAt?.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>
              </Link>
            </LazySection>
          )}

          {/* Row 2: 大事记时间线 */}
          {recentEvents.length > 0 && (
            <LazySection className="mb-10">
              <SectionHeading href="/events">大事记</SectionHeading>
              <div className="relative border-l-2 border-[#e8e0d5] ml-3 pl-6 space-y-3 max-h-[340px] overflow-y-auto">
                {recentEvents.map((post) => (
                  <div key={post.id} className="relative">
                    <span className="absolute -left-[29px] top-1.5 w-3 h-3 bg-[#c4a882] rounded-full" />
                    <Link href={`/events/${post.slug}`} className="block card group py-2.5 px-4">
                      <time className="text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)]">
                        {post.createdAt.toLocaleDateString("zh-CN")}
                      </time>
                      <h3 className="text-sm font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors mt-0.5 line-clamp-1">
                        {post.title}
                      </h3>
                    </Link>
                  </div>
                ))}
              </div>
            </LazySection>
          )}

          {/* Row 3: 便签卡片（5 个） */}
          <LazySection>
            <SectionHeading>便签</SectionHeading>
            {stickyNotes.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {["公告", "贴士", "入口", "须知", "待定"].map((label, i) => (
                  <div key={i} className={`${NOTE_COLORS[i]} rounded-sm p-4 text-center text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)] min-h-[100px] flex items-center justify-center`}>
                    {label}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {stickyNotes.map((note, i) => (
                  <div
                    key={note.id}
                    className={`${NOTE_COLORS[i % 5]} rounded-sm p-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between min-h-[100px]`}
                  >
                    <p className="text-xs text-[#2c2c2c] leading-relaxed line-clamp-4 font-[family-name:var(--font-sans)]">
                      {note.content}
                    </p>
                    <p className="text-[10px] text-[#6b6b6b] mt-2 font-[family-name:var(--font-sans)]">
                      {note.isAnonymous ? "匿名" : (note.author.displayName ?? note.author.username)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </LazySection>

        </div>
      </section>
    </>
  );
}
