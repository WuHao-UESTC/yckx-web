import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DraftsPage() {
  const session = await auth();
  const userId = (session?.user as { id: string }).id;

  const drafts = await prisma.post.findMany({
    where: { authorId: userId, status: "DRAFT" },
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
            <Link key={post.id} href={`/dashboard/editor/${post.id}`} className="card block hover:border-[#c4a882]">
              <h3 className="font-bold text-[#1a1a1a]">{post.title || "未命名草稿"}</h3>
              <p className="text-xs text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
                最后编辑: {post.updatedAt.toLocaleDateString("zh-CN")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
