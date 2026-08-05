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

  const [photos, stickyNotes] = await Promise.all([
    prisma.photo.findMany({
      include: { author: { select: { displayName: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.stickyNote.findMany({
      include: { author: { select: { displayName: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
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
