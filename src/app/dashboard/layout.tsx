import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as { name?: string; email?: string; role?: string };
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex gap-8">
        {/* 侧边栏 */}
        <aside className="hidden md:block w-48 shrink-0">
          <nav className="flex flex-col gap-1 font-[family-name:var(--font-sans)]">
            <p className="text-xs text-[#6b6b6b] uppercase tracking-wider mb-2 px-3">
              {user.name ?? "用户"}
            </p>
            <SidebarLink href="/dashboard">概览</SidebarLink>
            <SidebarLink href="/dashboard/editor">写文章</SidebarLink>
            <SidebarLink href="/dashboard/posts">我的文章</SidebarLink>
            <SidebarLink href="/dashboard/drafts">草稿箱</SidebarLink>
            <SidebarLink href="/dashboard/files">文件管理</SidebarLink>
            <SidebarLink href="/dashboard/profile">个人资料</SidebarLink>
            {isAdmin && (
              <>
                <hr className="my-2 border-[#e8e0d5]" />
                <p className="text-xs text-[#6b6b6b] uppercase tracking-wider mb-2 px-3">
                  管理
                </p>
                <SidebarLink href="/admin">管理面板</SidebarLink>
              </>
            )}
          </nav>
        </aside>

        {/* 主内容 */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block px-3 py-1.5 text-sm text-[#6b6b6b] rounded hover:text-[#8b5e3c] hover:bg-[#f5f0e8] transition-colors"
    >
      {children}
    </Link>
  );
}
