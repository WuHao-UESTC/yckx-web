import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PostCard } from "@/components/article/post-card";
import { PhotoLightbox } from "@/components/gallery/photo-lightbox";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { StickyNoteCard } from "@/components/routine/sticky-note-card";
import { RoutineGroupPhotoRail } from "@/components/routine/routine-group-photo-rail";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PhotoWallToolbar } from "@/modules/gallery/components/photo-wall-toolbar";
import {
  findPublicPhotoPage,
  parsePublicPhotoQuery,
  publicPhotoListHref,
} from "@/modules/gallery/server/public-photo-list";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";
import { PublicPostPager } from "@/modules/posts/components/public-post-pager";
import { PublicPostToolbar } from "@/modules/posts/components/public-post-toolbar";
import { findPublicPostPage, parsePublicPostQuery } from "@/modules/posts/server/public-post-list";

export const revalidate = 300;

type RoutineSearchParams = {
  q?: string;
  sort?: string;
  page?: string;
  photoQ?: string;
  photoFrom?: string;
  photoTo?: string;
  photoPage?: string;
};

export default async function RoutinePage({
  searchParams,
}: {
  searchParams: Promise<RoutineSearchParams>;
}) {
  const rawQuery = await searchParams;
  const articleQuery = parsePublicPostQuery(rawQuery);
  const photoQuery = parsePublicPhotoQuery(rawQuery);
  const session = await auth();
  const currentUserId = (session?.user as { id?: string })?.id ?? null;
  const currentUserRole = (session?.user as { role?: string })?.role ?? null;

  const [photoPage, groupPhotos, stickyNotes, dailyColumns, articlePage] = await Promise.all([
    findPublicPhotoPage(photoQuery),
    prisma.photo.findMany({
      where: { kind: "GROUP", isVisible: true },
      select: {
        id: true,
        imagePath: true,
        caption: true,
        year: true,
        createdAt: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.stickyNote.findMany({
      include: { author: { select: { displayName: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.column.findMany({
      where: { type: "DAILY", isActive: true },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        _count: {
          select: { dailyPosts: { where: { post: { status: "PUBLISHED", kind: "DAILY" } } } },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    findPublicPostPage({ scope: { kind: "DAILY" }, ...articleQuery }),
  ]);

  const copy = HOME_CHAPTER_COPY.routine;
  const hasPhotoFilters = Boolean(photoQuery.q || photoQuery.from || photoQuery.to);

  return (
    <InteriorPage
      theme="routine"
      depth={copy.depth}
      section={copy.label}
      title={copy.title}
      description={copy.description}
      className="routine-page"
      contentWidth="full"
      actions={<RoutineGroupPhotoRail photos={groupPhotos} />}
    >
      <div className="routine-page__layout">
        <main className="routine-page__main">
          <section id="photo-wall" className="routine-page__gallery" aria-label="照片墙">
            <InteriorSectionHeading title="照片墙" meta={`共 ${photoPage.total} 张公开照片`} />
            <PhotoWallToolbar query={photoQuery} />
            {photoPage.photos.length > 0 ? (
              <PhotoLightbox photos={photoPage.photos} />
            ) : (
              <InteriorEmpty>
                {hasPhotoFilters ? "没有找到符合条件的照片。" : "照片墙仍在等待新的同行影像。"}
              </InteriorEmpty>
            )}
            {photoPage.totalPages > 1 && (
              <nav className="routine-photo-pager" aria-label="切换照片墙">
                {photoQuery.page > 1 && (
                  <Link
                    href={publicPhotoListHref("/routine", {
                      ...photoQuery,
                      page: photoQuery.page - 1,
                    })}
                    className="btn-primary"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                    <span>上一面照片墙</span>
                  </Link>
                )}
                <span>
                  {photoQuery.page} / {photoPage.totalPages}
                </span>
                {photoQuery.page < photoPage.totalPages && (
                  <Link
                    href={publicPhotoListHref("/routine", {
                      ...photoQuery,
                      page: photoQuery.page + 1,
                    })}
                    className="btn-primary"
                  >
                    <span>下一面照片墙</span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </nav>
            )}
          </section>

          <section className="routine-page__columns" aria-label="日常专栏和文章">
            <InteriorSectionHeading title="日常专栏" meta={`${dailyColumns.length} 个专题入口`} />
            {dailyColumns.length > 0 ? (
              <nav className="routine-column-index" aria-label="日常专栏">
                {dailyColumns.map((column) => (
                  <Link key={column.id} href={`/routine/columns/${column.slug}`}>
                    <strong>{column.title}</strong>
                    <span>{column._count.dailyPosts} 篇文章</span>
                    {column.description && <small>{column.description}</small>}
                  </Link>
                ))}
              </nav>
            ) : (
              <InteriorEmpty>暂无公开日常专栏。</InteriorEmpty>
            )}

            <div className="routine-public-posts">
              <InteriorSectionHeading title="日常文章" meta={`共 ${articlePage.total} 篇文章`} />
              <PublicPostToolbar
                query={articleQuery.q}
                sort={articleQuery.sort}
                placeholder="搜索日常文章"
              />
              {articlePage.posts.length > 0 ? (
                <div className="post-signal-list">
                  {articlePage.posts.map((post) => (
                    <PostCard key={post.id} post={post} showTags />
                  ))}
                </div>
              ) : (
                <InteriorEmpty>
                  {articleQuery.q
                    ? `没有找到“${articleQuery.q}”相关的文章。`
                    : "暂无公开日常文章。"}
                </InteriorEmpty>
              )}
              <PublicPostPager
                pathname="/routine"
                query={articleQuery}
                totalPages={articlePage.totalPages}
                label="日常文章分页"
              />
            </div>
          </section>
        </main>

        <aside className="routine-page__notes" aria-label="舱内留言">
          <div className="routine-page__notes-inner">
            <InteriorSectionHeading title="舱内留言" meta={`${stickyNotes.length} 张便签`} />
            {stickyNotes.length === 0 ? (
              <InteriorEmpty>等待下一张舱内留言。</InteriorEmpty>
            ) : (
              <div className="routine-note-timeline">
                {stickyNotes.map((note, index) => (
                  <div key={note.id} className="routine-note-timeline__item">
                    <time dateTime={note.createdAt.toISOString()}>
                      {note.createdAt.toLocaleDateString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                      })}
                      <span>{note.createdAt.getFullYear()}</span>
                    </time>
                    <span className="routine-note-timeline__marker" aria-hidden="true" />
                    <StickyNoteCard
                      note={note}
                      index={index}
                      showDate={false}
                      canDelete={currentUserId === note.authorId || currentUserRole === "ADMIN"}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </InteriorPage>
  );
}
