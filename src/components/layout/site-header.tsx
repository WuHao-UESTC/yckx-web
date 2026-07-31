import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 bg-[#fdfcf9]/90 backdrop-blur border-b border-[#e8e0d5]">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-wide text-[#1a1a1a] no-underline font-[family-name:var(--font-serif)] hover:text-[#8b5e3c] transition-colors"
        >
          {SITE_NAME}
        </Link>

        {/* 主导航 */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm text-[#6b6b6b] rounded hover:text-[#8b5e3c] hover:bg-[#f5f0e8] transition-colors font-[family-name:var(--font-sans)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 右侧：搜索 + 用户 */}
        <div className="flex items-center gap-2">
          {/* 搜索入口 */}
          <Link
            href="/search"
            className="text-sm text-[#6b6b6b] hover:text-[#8b5e3c] transition-colors px-2 py-1 font-[family-name:var(--font-sans)]"
            aria-label="搜索"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
          </Link>

          {/* 用户状态 */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="text-sm text-[#6b6b6b] hover:text-[#8b5e3c] transition-colors font-[family-name:var(--font-sans)]"
              >
                {(user as { name?: string }).name || "后台"}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-[#8b5e3c] hover:text-[#5a3a22] transition-colors font-[family-name:var(--font-sans)]"
                >
                  退出
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm text-[#8b5e3c] hover:text-[#5a3a22] transition-colors font-[family-name:var(--font-sans)]"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
