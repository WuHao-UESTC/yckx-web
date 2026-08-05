import Link from "next/link";
import { LayoutDashboard, LogIn, LogOut, Search } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-brand" aria-label={`${SITE_NAME}首页`}>
          <span className="site-brand__mark" aria-hidden="true" />
          <span className="site-brand__copy">
            <strong>{SITE_NAME}</strong>
            <small>UESTC · HONORS COLLEGE</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="主导航">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-actions">
          <Link href="/search" className="site-icon-button" aria-label="搜索站内内容" title="搜索">
            <Search size={17} aria-hidden="true" />
          </Link>

          {user ? (
            <>
              <Link
                href={user.role === "GUEST" ? "/guest" : "/dashboard"}
                className="site-user-link"
                title="进入个人后台"
              >
                <LayoutDashboard size={15} aria-hidden="true" />
                <span>{user.name || "工作台"}</span>
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="site-signout" title="退出登录">
                  <LogOut size={15} aria-hidden="true" />
                  <span>退出</span>
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="site-user-link" title="登录">
              <LogIn size={15} aria-hidden="true" />
              <span>登录</span>
            </Link>
          )}

          <MobileNav />
        </div>
      </div>
    </header>
  );
}
