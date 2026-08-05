import { prisma } from "@/lib/prisma";
import { RoutineComposer } from "@/modules/routine/components/routine-composer";
import { requireUser } from "@/server/auth/guards";

export default async function DashboardRoutinePage() {
  const user = await requireUser();
  const [noteCount, photoCount, dailyPostCount] = await Promise.all([
    prisma.stickyNote.count({ where: { authorId: user.id } }),
    prisma.photo.count({ where: { authorId: user.id, kind: "WALL" } }),
    prisma.post.count({ where: { authorId: user.id, kind: "DAILY" } }),
  ]);

  return (
    <RoutineComposer
      noteCount={noteCount}
      photoCount={photoCount}
      dailyPostCount={dailyPostCount}
    />
  );
}
