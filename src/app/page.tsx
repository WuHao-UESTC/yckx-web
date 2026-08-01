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
    latestPosts,
    recentPhotos,
    recentEvents,
    calendarPosts,
    categories,
    stickyNotes,
    newsHeadline,
  ] = await Promise.all([
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
    prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED", category: { type: "EVENT" } },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, title: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 200,
    }),
    prisma.category.findMany({
      include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.stickyNote.findMany({
      include: { author: { select: { displayName: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.post.findFirst({
      where: { status: "PUBLISHED", category: { type: "EVENT" } },
      include: { author: { select: { displayName: true, username: true } }, category: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  return { latestPosts, recentPhotos, recentEvents, calendarPosts, categories, stickyNotes, newsHeadline };
}

// ══════════════════════════════════════════════════════
// 知识图谱数据构建
// ══════════════════════════════════════════════════════
function buildGraphData(categories: Awaited<ReturnType<typeof getHomeData>>["categories"]): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

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
const NOTE_COLORS = ["bg-[#fef9e7]", "bg-[#fdedec]", "bg-[#ebf5fb]", "bg-[#eafaf1]", "bg-[#f4ecf7]"];

// ══════════════════════════════════════════════════════
export default async function Home() {
  const { latestPosts, recentPhotos, recentEvents, calendarPosts, categories, stickyNotes, newsHeadline } = await getHomeData();
  const graphData = buildGraphData(categories);

  const calPosts = calendarPosts
    .filter((p) => p.publishedAt)
    .map((p) => ({ date: p.publishedAt!.toISOString(), slug: p.slug, title: p.title }));

  const carouselImages = recentPhotos.map((p) => ({
    src: p.imagePath,
    alt: p.caption ?? "科协照片",
    caption: p.caption ?? undefined,
  }));

  return (
    <>
      {/* ════════════════════════════════════════════════ */}
      {/* Part 1 — 整体展示区   snap-section               */}
      {/* ════════════════════════════════════════════════ */}
      <section className="snap-section paper-texture border-b border-[#e8e0d5] flex items-center">
        <div className="w-full max-w-[1160px] mx-auto px-5 py-10">
          {/* Row 1: LOGO | 轮播图 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center px-6">
              <div className="w-24 h-24 rounded-full bg-[#f5f0e8] flex items-center justify-center mb-4 border-2 border-[#e8e0d5]">
                <span className="text-3xl font-bold text-[#8b5e3c] tracking-widest">科协</span>
              </div>
              <h1 className="text-3xl font-bold text-[#1a1a1a] mb-3 tracking-wide">英才科协</h1>
              <p className="text-sm text-[#8b5e3c] tracking-[0.25em] font-[family-name:var(--font-sans)]">
                自由 · 创新 · 博学 · 精进
              </p>
            </div>
            <div className="min-h-[200px]">
              <ImageCarousel images={carouselImages} interval={3500} />
            </div>
          </div>

          {/* Row 3: 最新文章 | 日历 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <div className="lg:col-span-1">
              <div className="card">
                <PostCalendar posts={calPosts} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* Part 2 — 知识库与竞赛区   snap-section             */}
      {/* ════════════════════════════════════════════════ */}
      <section className="snap-section bg-[#fefefd] border-b border-[#e8e0d5] flex items-center">
        <div className="w-full px-5 py-8">
          <div className="max-w-[1400px] mx-auto">
            <SectionHeading>知识库与竞赛</SectionHeading>
          </div>
          {/* 6:4 全宽布局 */}
          <KnowledgeGraphCanvas
            nodes={graphData.nodes}
            links={graphData.links}
          />
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* Part 3 — 科协新闻与日常   snap-section             */}
      {/* ════════════════════════════════════════════════ */}
      <section className="snap-section paper-texture flex items-center">
        <div className="w-full max-w-[1160px] mx-auto px-5 py-10">

          {/* 新闻头条 */}
          {newsHeadline && (
            <LazySection className="mb-8">
              <SectionHeading href="/events">科协新闻</SectionHeading>
              <Link href={`/events/${newsHeadline.slug}`} className="block card group overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {newsHeadline.coverImage && (
                    <div className="w-full sm:w-56 shrink-0 rounded-md overflow-hidden bg-[#f5f0e8]">
                      <img src={newsHeadline.coverImage} alt={newsHeadline.title}
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
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

          {/* 大事记时间线 — 充足空间，不再截断 */}
          {recentEvents.length > 0 && (
            <LazySection className="mb-8">
              <SectionHeading href="/events">大事记</SectionHeading>
              <div className="relative border-l-2 border-[#e8e0d5] ml-3 pl-8 space-y-3">
                {recentEvents.map((post) => (
                  <div key={post.id} className="relative">
                    <span className="absolute -left-[35px] top-2 w-3 h-3 bg-[#c4a882] rounded-full" />
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

          {/* 便签卡片 */}
          <LazySection>
            <SectionHeading>便签</SectionHeading>
            {stickyNotes.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {["公告", "贴士", "入口", "须知", "待定"].map((label, i) => (
                  <div key={i} className={`${NOTE_COLORS[i]} rounded-sm p-4 text-center text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)] min-h-[80px] flex items-center justify-center`}>
                    {label}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {stickyNotes.map((note, i) => (
                  <div key={note.id}
                    className={`${NOTE_COLORS[i % 5]} rounded-sm p-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between min-h-[80px]`}>
                    <p className="text-xs text-[#2c2c2c] leading-relaxed line-clamp-3 font-[family-name:var(--font-sans)]">
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
