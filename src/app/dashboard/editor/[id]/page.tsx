import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostEditor, type EditorInitialPost } from "@/modules/posts/components/post-editor";
import { assertOwnerOrAdmin, requireUser } from "@/server/auth/guards";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      status: true,
      kind: true,
      authorId: true,
      categoryId: true,
      columnId: true,
      tags: { select: { tag: { select: { name: true } } } },
      files: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, filename: true, mimeType: true, size: true },
      },
    },
  });
  if (!post) notFound();
  assertOwnerOrAdmin(user, post.authorId);

  const [categories, columns] = await Promise.all([
    prisma.category.findMany({
      where: {
        type: { in: ["KNOWLEDGE", "COMPETITION"] },
        OR: [{ isActive: true }, ...(post.categoryId ? [{ id: post.categoryId }] : [])],
      },
      select: { id: true, name: true, type: true, isActive: true },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.column.findMany({
      where: {
        type: post.kind === "DAILY" ? "DAILY" : "NEWS",
        OR: [{ isActive: true }, ...(post.columnId ? [{ id: post.columnId }] : [])],
      },
      select: { id: true, title: true, type: true, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const initialPost: EditorInitialPost = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    status: post.status,
    kind: post.kind,
    categoryId: post.categoryId,
    columnId: post.columnId,
    tags: post.tags.map(({ tag }) => tag.name),
    files: post.files,
  };

  return (
    <PostEditor
      kind={post.kind}
      categories={categories}
      columns={columns}
      initialPost={initialPost}
    />
  );
}
