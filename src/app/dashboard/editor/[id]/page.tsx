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
      category: { select: { type: true } },
      columnId: true,
      renderStyle: true,
      technicalColumns: { select: { columnId: true } },
      newsColumns: { select: { columnId: true } },
      dailyColumns: { select: { columnId: true } },
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
        type: post.kind === "TECHNICAL" ? "TECHNICAL" : post.kind === "DAILY" ? "DAILY" : "NEWS",
        OR: [
          { isActive: true },
          ...(post.columnId ? [{ id: post.columnId }] : []),
          ...(post.kind === "TECHNICAL" && post.technicalColumns.length > 0
            ? [{ id: { in: post.technicalColumns.map(({ columnId }) => columnId) } }]
            : []),
          ...(post.kind === "NEWS" && post.newsColumns.length > 0
            ? [{ id: { in: post.newsColumns.map(({ columnId }) => columnId) } }]
            : []),
          ...(post.kind === "DAILY" && post.dailyColumns.length > 0
            ? [{ id: { in: post.dailyColumns.map(({ columnId }) => columnId) } }]
            : []),
        ],
      },
      select: { id: true, title: true, type: true, categoryId: true, isActive: true },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
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
    categoryType: post.category?.type ?? null,
    technicalColumnIds: post.technicalColumns.map(({ columnId }) => columnId),
    newsColumnIds: post.newsColumns.map(({ columnId }) => columnId),
    dailyColumnIds: post.dailyColumns.map(({ columnId }) => columnId),
    renderStyle: post.renderStyle,
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
