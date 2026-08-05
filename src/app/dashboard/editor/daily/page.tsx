import { prisma } from "@/lib/prisma";
import { PostEditor } from "@/modules/posts/components/post-editor";
import { requireUser } from "@/server/auth/guards";

export default async function NewDailyPostPage() {
  await requireUser();
  const columns = await prisma.column.findMany({
    where: { type: "DAILY", isActive: true },
    select: { id: true, title: true, type: true, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return <PostEditor kind="DAILY" categories={[]} columns={columns} />;
}
