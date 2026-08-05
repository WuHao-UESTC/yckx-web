import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/guards";

export default async function AdminPage() {
  await requireAdmin();
  const [userCount, postCount, recentUsers, postPublishedCount] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { username: true, displayName: true, createdAt: true },
    }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">管理面板</h1>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="card">
          <p className="text-3xl font-bold text-[#8b5e3c]">{userCount}</p>
          <p className="text-sm text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
            注册用户
          </p>
        </div>
        <div className="card">
          <p className="text-3xl font-bold text-[#8b5e3c]">{postPublishedCount}</p>
          <p className="text-sm text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
            已发布文章
          </p>
        </div>
        <div className="card">
          <p className="text-3xl font-bold text-[#5a8a6a]">{postCount}</p>
          <p className="text-sm text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
            文章总数（含草稿）
          </p>
        </div>
      </div>

      {/* 最近注册 */}
      {recentUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-[#1a1a1a] mb-3 font-[family-name:var(--font-sans)]">
            最近注册
          </h2>
          <div className="space-y-1">
            {recentUsers.map((u) => (
              <div key={u.username} className="card flex items-center gap-3 py-2.5 px-4">
                <span className="text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)] w-24">
                  {u.createdAt.toLocaleDateString("zh-CN")}
                </span>
                <span className="text-sm font-bold text-[#1a1a1a]">
                  {u.displayName ?? u.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/invitations" className="btn-primary">
          邀请码管理
        </Link>
        <Link href="/admin/users" className="btn-primary">
          用户管理
        </Link>
        <Link href="/admin/categories" className="btn-primary">
          分类管理
        </Link>
        <Link href="/admin/photos" className="btn-primary">
          照片墙管理
        </Link>
        <Link href="/admin/posts" className="btn-primary">
          文章管理
        </Link>
        <Link href="/admin/milestones" className="btn-primary">
          大事记编辑
        </Link>
        <Link href="/admin/config" className="btn-primary">
          站点配置
        </Link>
      </div>
    </div>
  );
}
