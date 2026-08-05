import { prisma } from "@/lib/prisma";
import { PostEditor } from "@/modules/posts/components/post-editor";
import { requireUser } from "@/server/auth/guards";

export default async function NewTechnicalPostPage() {
  await requireUser();
  const categories = await prisma.category.findMany({
    where: { type: { in: ["KNOWLEDGE", "COMPETITION"] }, isActive: true },
    select: { id: true, name: true, type: true, isActive: true },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  return <PostEditor kind="TECHNICAL" categories={categories} columns={[]} />;
}
