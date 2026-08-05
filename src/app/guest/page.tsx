import Link from "next/link";
import { MessageSquare, Newspaper, UserRound } from "lucide-react";
import { requireGuest } from "@/server/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function GuestPage() {
  const user = await requireGuest();
  const [subscriptions, comments] = await Promise.all([
    prisma.subscription.count({ where: { userId: user.id } }),
    prisma.comment.count({ where: { authorId: user.id } }),
  ]);
  return (
    <div className="workspace-overview">
      <header className="workspace-panel-heading">
        <span>READER STATUS</span>
        <h1>游客概览</h1>
        <p>管理昵称、密码、订阅和你发表的评论。</p>
      </header>
      <dl className="workspace-readouts">
        <div>
          <dt>订阅项目</dt>
          <dd>{subscriptions}</dd>
          <small>SUBSCRIPTIONS</small>
        </div>
        <div>
          <dt>我的评论</dt>
          <dd>{comments}</dd>
          <small>COMMENTS</small>
        </div>
      </dl>
      <section className="workspace-quick-actions">
        <Link href="/guest/subscriptions">
          <Newspaper size={20} aria-hidden="true" />
          <span>
            <strong>管理订阅</strong>
            <small>选择分类、专栏或整站板块</small>
          </span>
        </Link>
        <Link href="/guest/profile">
          <UserRound size={20} aria-hidden="true" />
          <span>
            <strong>账号资料</strong>
            <small>修改昵称和密码</small>
          </span>
        </Link>
        <Link href="/knowledge-base">
          <MessageSquare size={20} aria-hidden="true" />
          <span>
            <strong>浏览知识库</strong>
            <small>阅读文章并参与评论</small>
          </span>
        </Link>
      </section>
    </div>
  );
}
