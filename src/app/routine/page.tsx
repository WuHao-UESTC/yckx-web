import { prisma } from "@/lib/prisma";
import { PhotoLightbox } from "@/components/gallery/photo-lightbox";

export default async function RoutinePage() {
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

  const noteColors: Record<string, string> = {
    yellow: "bg-[#fef9e7]",
    pink: "bg-[#fdedec]",
    blue: "bg-[#ebf5fb]",
    green: "bg-[#eafaf1]",
    purple: "bg-[#f4ecf7]",
    orange: "bg-[#fef5e7]",
  };

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
        {stickyNotes.length === 0 ? (
          <p className="text-[#6b6b6b]">暂无吐槽，世界和平 🕊️</p>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
            {stickyNotes.map((note, i) => {
              const rotation = ((i % 5) - 2) * 1.5;
              const colorClass = noteColors[note.color] || noteColors.yellow;
              return (
                <div
                  key={note.id}
                  className={`${colorClass} break-inside-avoid mb-4 p-4 rounded-sm shadow-sm hover:shadow-md hover:scale-[1.02] hover:-rotate-0 transition-all duration-200`}
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <p className="text-sm text-[#2c2c2c] leading-relaxed font-[family-name:var(--font-sans)]">
                    {note.content}
                  </p>
                  <p className="text-[10px] text-[#6b6b6b] mt-2 font-[family-name:var(--font-sans)]">
                    {note.isAnonymous ? "匿名" : (note.author.displayName ?? note.author.username)} ·{" "}
                    {note.createdAt.toLocaleDateString("zh-CN")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
