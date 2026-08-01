import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PhotoLightbox } from "@/components/gallery/photo-lightbox";
import { StickyNoteForm } from "@/components/routine/sticky-note-form";
import { StickyNoteCard } from "@/components/routine/sticky-note-card";

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

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      {/* 照片墙 */}
      <section className="mb-12">
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-6">科协日常</h1>
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-4 pb-2 border-b border-[#e8e0d5]">照片墙</h2>
        {photos.length === 0 ? (
          <p className="text-[#6b6b6b]">暂无照片。</p>
        ) : (
          <PhotoLightbox photos={photos} />
        )}
      </section>

      {/* 吐槽便签 */}
      <section>
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-4 pb-2 border-b border-[#e8e0d5]">吐槽便签</h2>

        {/* 发布表单（需登录） */}
        <StickyNoteForm isLoggedIn={!!currentUserId} />

        {/* 便签列表 */}
        {stickyNotes.length === 0 ? (
          <p className="text-[#6b6b6b]">暂无吐槽，世界和平 🕊️</p>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
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
    </div>
  );
}
