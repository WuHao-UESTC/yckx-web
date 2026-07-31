import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { profile: true, _count: { select: { posts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">用户管理</h1>
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="card flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#1a1a1a]">
                {user.displayName ?? user.username}
                <span className={`ml-2 tag text-xs ${user.role === "ADMIN" ? "bg-amber-100 text-amber-700" : ""}`}>
                  {user.role === "ADMIN" ? "管理员" : "成员"}
                </span>
              </p>
              <p className="text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)]">
                {user.email} · {user._count.posts} 篇文章 · 加入于 {user.createdAt.toLocaleDateString("zh-CN")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
