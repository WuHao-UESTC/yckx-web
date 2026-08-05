import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth/guards";

export default async function AdminCommentsPage() {
  await requireAdmin();
  const comments = await prisma.comment.findMany({
    include: {
      author: { select: { username: true, displayName: true } },
      post: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  async function deleteComment(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = String(formData.get("id") ?? "");
    if (id) await prisma.comment.delete({ where: { id } });
    revalidatePath("/admin/comments");
  }
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">评论管理</h1>
      {comments.length === 0 ? (
        <p className="text-[#6b6b6b]">暂无评论。</p>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <article key={comment.id} className="card flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {comment.author.displayName ?? comment.author.username}{" "}
                  <span className="text-xs font-normal text-[#6b6b6b]">
                    评论于《{comment.post.title}》
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{comment.content}</p>
                <small className="text-[#6b6b6b]">
                  {comment.createdAt.toLocaleString("zh-CN")}
                </small>
              </div>
              <form action={deleteComment}>
                <input type="hidden" name="id" value={comment.id} />
                <button className="text-sm text-red-700" type="submit">
                  删除
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
