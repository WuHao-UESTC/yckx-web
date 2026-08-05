import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { resourceIdSchema } from "@/modules/admin/admin.schemas";
import { requireAdmin } from "@/server/auth/guards";
import { ConflictError } from "@/server/http/errors";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdmin();
  const { q } = await searchParams;

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { username: { contains: q } },
            { displayName: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {},
    include: { profile: true, _count: { select: { posts: true } } },
    orderBy: { createdAt: "desc" },
  });

  async function toggleRole(formData: FormData) {
    "use server";
    const currentAdmin = await requireAdmin();
    const userId = resourceIdSchema.parse(formData.get("userId"));
    const target = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { role: true },
    });

    if (userId === currentAdmin.id && target.role === "ADMIN") {
      throw new ConflictError("不能移除自己的管理员权限");
    }

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) throw new ConflictError("系统必须保留至少一名管理员");
    }

    const newRole = target.role === "ADMIN" ? "MEMBER" : "ADMIN";
    await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
    revalidatePath("/admin/users");
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">用户管理</h1>

      {/* 搜索 */}
      <form className="flex gap-3 mb-6">
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="搜索用户名 / 邮箱..."
          className="input-field flex-1 max-w-sm"
        />
        <button type="submit" className="btn-primary text-sm">
          搜索
        </button>
        {q && (
          <a
            href="/admin/users"
            className="text-sm text-[#6b6b6b] hover:text-[#8b5e3c] self-center font-[family-name:var(--font-sans)]"
          >
            清除
          </a>
        )}
      </form>

      {/* 用户列表 */}
      {users.length === 0 ? (
        <p className="text-[#6b6b6b]">未找到匹配的用户。</p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="card flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#f5f0e8] flex items-center justify-center text-base text-[#8b5e3c] font-bold shrink-0">
                  {(user.displayName ?? user.username).charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1a1a1a] flex items-center gap-2">
                    {user.displayName ?? user.username}
                    <span
                      className={`tag text-xs ${user.role === "ADMIN" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}
                    >
                      {user.role === "ADMIN" ? "管理员" : "成员"}
                    </span>
                  </p>
                  <p className="text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)] truncate">
                    {user.email} · {user._count.posts} 篇文章 · 加入于{" "}
                    {user.createdAt.toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>
              {/* 角色切换 */}
              <form action={toggleRole} className="shrink-0">
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="currentRole" value={user.role} />
                <button
                  type="submit"
                  className={`text-xs px-3 py-1 rounded font-[family-name:var(--font-sans)] transition-colors ${user.role === "ADMIN" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-stone-50 text-stone-600 hover:bg-stone-100"}`}
                >
                  {user.role === "ADMIN" ? "降为成员" : "升为管理员"}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
