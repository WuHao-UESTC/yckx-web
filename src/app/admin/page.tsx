import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  Image,
  KeyRound,
  ListTree,
  Orbit,
  Settings,
  UsersRound,
} from "lucide-react";
import { requireAdmin } from "@/server/auth/guards";

const ADMIN_STATIONS = [
  { href: "/admin/posts", label: "文章管理", meta: "公开信号与状态", icon: FileText },
  { href: "/admin/users", label: "用户管理", meta: "成员身份与权限", icon: UsersRound },
  { href: "/admin/categories", label: "分类管理", meta: "知识与竞赛坐标", icon: ListTree },
  { href: "/admin/photos", label: "日常影像管理", meta: "合照与照片墙", icon: Image },
  { href: "/admin/milestones", label: "大事记编辑", meta: "时间回声节点", icon: Orbit },
  { href: "/admin/invitations", label: "邀请码管理", meta: "新成员通行信号", icon: KeyRound },
  { href: "/admin/config", label: "站点配置", meta: "全站基础参数", icon: Settings },
] as const;

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
    <div className="admin-overview">
      <header className="workspace-panel-heading">
        <span>STATION OVERVIEW</span>
        <h1>管理观测总览</h1>
        <p>校准内容、成员与站点配置，维持公开星图的准确性。</p>
      </header>

      <dl className="workspace-readouts">
        <div>
          <dt>注册用户</dt>
          <dd>{userCount}</dd>
          <small>IDENTIFIED MEMBERS</small>
        </div>
        <div>
          <dt>已发布文章</dt>
          <dd>{postPublishedCount}</dd>
          <small>VISIBLE SIGNALS</small>
        </div>
        <div>
          <dt>文章总数</dt>
          <dd>{postCount}</dd>
          <small>ALL RECORDS</small>
        </div>
      </dl>

      {recentUsers.length > 0 && (
        <section className="admin-recent-users">
          <div className="admin-section-heading">
            <h2>最近识别的成员</h2>
            <span>{recentUsers.length} 条读数</span>
          </div>
          <div>
            {recentUsers.map((u) => (
              <div key={u.username}>
                <time dateTime={u.createdAt.toISOString()}>
                  {u.createdAt.toLocaleDateString("zh-CN")}
                </time>
                <strong>{u.displayName ?? u.username}</strong>
                <small>@{u.username}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="admin-station-index" aria-label="管理功能">
        {ADMIN_STATIONS.map(({ href, label, meta, icon: Icon }, index) => (
          <Link href={href} key={href}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <strong>{label}</strong>
              <small>{meta}</small>
            </div>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        ))}
      </section>
    </div>
  );
}
