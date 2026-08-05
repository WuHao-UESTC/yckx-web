import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PhotoLightbox } from "@/components/gallery/photo-lightbox";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { StickyNoteForm } from "@/components/routine/sticky-note-form";
import { StickyNoteCard } from "@/components/routine/sticky-note-card";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

export const revalidate = 300;

export default async function RoutinePage() {
  const session = await auth();
  const currentUserId = (session?.user as { id?: string })?.id ?? null;
  const currentUserRole = (session?.user as { role?: string })?.role ?? null;

  const [photos, stickyNotes, dailyColumns, dailyPosts] = await Promise.all([
    prisma.photo.findMany({
      where: { isVisible: true },
      include: { author: { select: { displayName: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
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
        _count: { select: { posts: { where: { status: "PUBLISHED", kind: "DAILY" } } } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.post.findMany({
      where: { kind: "DAILY", status: "PUBLISHED" },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        category: true,
        column: true,
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
  ]);

  const copy = HOME_CHAPTER_COPY.routine;

  return (
    <InteriorPage
      theme="routine"
      depth={copy.depth}
      section={copy.label}
      title={copy.title}
      description={copy.description}
    >
      <section className="routine-page__columns">
        <InteriorSectionHeading title="日常专栏" meta={`${dailyColumns.length} 条长期记录航道`} />
        {dailyColumns.length > 0 && (
          <nav className="routine-column-index" aria-label="日常专栏">
            {dailyColumns.map((column) => (
              <Link key={column.id} href={`/routine/columns/${column.slug}`}>
                <strong>{column.title}</strong>
                <span>{column._count.posts} 篇</span>
                {column.description && <small>{column.description}</small>}
              </Link>
            ))}
          </nav>
        )}
        <div className="post-signal-list">
          {dailyPosts.map((post) => (
            <PostCard key={post.id} post={post} showTags />
          ))}
          {dailyPosts.length === 0 && <InteriorEmpty>日常专栏仍在等待第一篇记录。</InteriorEmpty>}
        </div>
      </section>

      <section className="routine-page__gallery">
        <InteriorSectionHeading title="同行影像" meta={`${photos.length} 张日常照片`} />
        {photos.length === 0 ? (
          <InteriorEmpty>照片墙仍在等待新的同行影像。</InteriorEmpty>
        ) : (
          <PhotoLightbox photos={photos} />
        )}
      </section>

      <section className="routine-page__notes">
        <InteriorSectionHeading title="舱内留言" meta={`${stickyNotes.length} 张便签`} />
        <StickyNoteForm isLoggedIn={!!currentUserId} />
        {stickyNotes.length === 0 ? (
          <InteriorEmpty>等待下一张舱内留言。</InteriorEmpty>
        ) : (
          <div className="routine-note-wall columns-2 gap-4 sm:columns-3 lg:columns-4">
            {stickyNotes.map((note, i) => (
              <StickyNoteCard
                key={note.id}
                note={note}
                index={i}
                canDelete={currentUserId === note.authorId || currentUserRole === "ADMIN"}
              />
            ))}
          </div>
        )}
      </section>
    </InteriorPage>
  );
}
import Link from "next/link";
import { PostCard } from "@/components/article/post-card";
