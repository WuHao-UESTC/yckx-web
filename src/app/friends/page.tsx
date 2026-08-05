import Link from "next/link";
import { ArrowUpRight, Fish } from "lucide-react";
import { InteriorEmpty, InteriorPage } from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

export default async function FriendsPage() {
  const users = await prisma.user.findMany({
    where: { role: { not: "GUEST" } },
    include: {
      profile: true,
      _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const copy = HOME_CHAPTER_COPY.routine;

  return (
    <InteriorPage
      theme="routine"
      depth={copy.depth}
      section="同行者"
      title={copy.title}
      description="名字跟随每一条不同的航线，汇成技术之外真实的科协。"
    >
      {users.length === 0 ? (
        <InteriorEmpty>成员信号仍在等待接入。</InteriorEmpty>
      ) : (
        <div className="friend-stream">
          {users.map((user, index) => (
            <Link
              key={user.id}
              href={`/friends/${user.username}`}
              className="friend-stream__member"
            >
              <span className="friend-stream__index">{String(index + 1).padStart(2, "0")}</span>
              <Fish
                className="friend-stream__fish"
                size={34}
                strokeWidth={1.25}
                aria-hidden="true"
              />
              <span className="friend-stream__avatar">
                {(user.displayName ?? user.username).charAt(0)}
              </span>
              <span className="friend-stream__identity">
                <strong>{user.displayName ?? user.username}</strong>
                <small>
                  {user.profile?.title || (user.role === "ADMIN" ? "科协管理员" : "科协成员")}
                </small>
              </span>
              <span className="friend-stream__posts">
                <strong>{user._count.posts}</strong>
                <small>篇公开文章</small>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </InteriorPage>
  );
}
