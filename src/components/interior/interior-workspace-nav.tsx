"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  FileText,
  FolderOpen,
  Gauge,
  Image,
  KeyRound,
  LayoutDashboard,
  ListTree,
  NotebookPen,
  Orbit,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";

const WORKSPACE_ITEMS = [
  { href: "/dashboard", label: "概览", icon: Gauge, exact: true },
  { href: "/dashboard/editor", label: "写文章", icon: NotebookPen },
  { href: "/dashboard/posts", label: "我的文章", icon: FileText },
  { href: "/dashboard/drafts", label: "草稿箱", icon: Archive },
  { href: "/dashboard/files", label: "文件管理", icon: FolderOpen },
  { href: "/dashboard/profile", label: "个人资料", icon: UserRound },
] as const;

const ADMIN_ITEMS = [
  { href: "/admin", label: "观测总览", icon: LayoutDashboard, exact: true },
  { href: "/admin/posts", label: "文章管理", icon: FileText },
  { href: "/admin/users", label: "用户管理", icon: UsersRound },
  { href: "/admin/categories", label: "分类管理", icon: ListTree },
  { href: "/admin/photos", label: "照片墙", icon: Image },
  { href: "/admin/milestones", label: "大事记", icon: Orbit },
  { href: "/admin/invitations", label: "邀请码", icon: KeyRound },
  { href: "/admin/config", label: "站点配置", icon: Settings },
] as const;

export function InteriorWorkspaceNav({
  variant,
  label,
  showAdminLink = false,
}: {
  variant: "workspace" | "admin";
  label: string;
  showAdminLink?: boolean;
}) {
  const pathname = usePathname();
  const items = variant === "admin" ? ADMIN_ITEMS : WORKSPACE_ITEMS;

  return (
    <nav className="workspace-nav" aria-label={variant === "admin" ? "管理导航" : "工作台导航"}>
      <div className="workspace-nav__identity">
        <span aria-hidden="true" />
        <div>
          <small>{variant === "admin" ? "ABYSSAL STATION" : "RESEARCH LOG"}</small>
          <strong>{label}</strong>
        </div>
      </div>
      <div className="workspace-nav__links">
        {items.map((item) => {
          const { href, label: itemLabel, icon: Icon } = item;
          const isExact = "exact" in item && item.exact;
          const isActive = isExact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={isActive ? "page" : undefined}>
              <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
              <span>{itemLabel}</span>
            </Link>
          );
        })}
        {variant === "workspace" && showAdminLink && (
          <Link href="/admin" className="workspace-nav__admin-link">
            <Orbit size={16} strokeWidth={1.6} aria-hidden="true" />
            <span>管理观测站</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
