import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/guards";

export default async function DashboardPage() {
  const user = await requireUser();
  const userId = user.id;

  const [postCount, draftCount, fileCount] = await Promise.all([
    prisma.post.count({ where: { authorId: userId, status: "PUBLISHED" } }),
    prisma.post.count({ where: { authorId: userId, status: "DRAFT" } }),
    prisma.file.count({ where: { uploaderId: userId } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">后台概览</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-3xl font-bold text-[#8b5e3c]">{postCount}</p>
          <p className="text-sm text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
            已发布文章
          </p>
        </div>
        <div className="card">
          <p className="text-3xl font-bold text-[#c4944a]">{draftCount}</p>
          <p className="text-sm text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">草稿</p>
        </div>
        <div className="card">
          <p className="text-3xl font-bold text-[#5a8a6a]">{fileCount}</p>
          <p className="text-sm text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
            上传文件
          </p>
        </div>
      </div>
    </div>
  );
}
