import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requireUser } from "@/server/auth/guards";

export default async function DraftsPage() {
  const user = await requireUser();
  const userId = user.id;

  const drafts = await prisma.post.findMany({
    where: { authorId: userId, status: "DRAFT" },
    include: { category: true, column: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">草稿箱</h1>
      {drafts.length === 0 ? (
        <p className="text-[#6b6b6b]">暂无草稿。</p>
      ) : (
        <div className="space-y-2">
          {drafts.map((post) => (
            <Link
              key={post.id}
              href={`/dashboard/editor/${post.id}`}
              className="card block hover:border-[#c4a882]"
            >
              <h3 className="font-bold text-[#1a1a1a]">{post.title || "未命名草稿"}</h3>
              <p className="text-xs text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
                最后编辑: {post.updatedAt.toLocaleDateString("zh-CN")}
                <span className="ml-2">
                  {post.kind === "TECHNICAL" ? "技术" : post.kind === "NEWS" ? "新闻" : "日常"}
                </span>
                {post.category && <span className="ml-2">{post.category.name}</span>}
                {post.column && <span className="ml-2">{post.column.title}</span>}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
