import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function FriendsPage() {
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    include: {
      profile: true,
      _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">友链</h1>
      <p className="text-[#6b6b6b] mb-8 font-[family-name:var(--font-sans)]">科协成员的个人主页</p>

      {users.length === 0 ? (
        <p className="text-[#6b6b6b]">暂无成员。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/friends/${user.username}`}
              className="card group flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#f5f0e8] flex items-center justify-center text-lg text-[#8b5e3c] font-bold shrink-0">
                {(user.displayName ?? user.username).charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors truncate">
                  {user.displayName ?? user.username}
                </h3>
                <p className="text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)]">
                  {user.profile?.title || "科协成员"} · {user._count.posts} 篇文章
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
