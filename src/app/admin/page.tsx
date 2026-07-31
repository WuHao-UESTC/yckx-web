import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminPage() {
  const [userCount, postCount] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">管理面板</h1>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="card">
          <p className="text-3xl font-bold text-[#8b5e3c]">{userCount}</p>
          <p className="text-sm text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">注册用户</p>
        </div>
        <div className="card">
          <p className="text-3xl font-bold text-[#8b5e3c]">{postCount}</p>
          <p className="text-sm text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">文章总数</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Link href="/admin/invitations" className="btn-primary">邀请码管理</Link>
        <Link href="/admin/users" className="btn-primary">用户管理</Link>
        <Link href="/admin/categories" className="btn-primary">分类管理</Link>
      </div>
    </div>
  );
}
