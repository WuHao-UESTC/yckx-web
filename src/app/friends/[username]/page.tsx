import { notFound } from "next/navigation";
import { Code2, Globe2, PlaySquare } from "lucide-react";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/article/post-card";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PersonalPage({ params }: Props) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      profile: true,
      _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
    },
  });
  if (!user) notFound();

  const posts = await prisma.post.findMany({
    where: { authorId: user.id, status: "PUBLISHED" },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatar: true } },
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  const copy = HOME_CHAPTER_COPY.routine;
  const name = user.displayName ?? user.username;

  return (
    <InteriorPage
      theme="routine"
      depth={copy.depth}
      section="同行者记录"
      title={name}
      description={user.bio ?? "每一位同行者，都在共同航线上留下自己的光。"}
      contentWidth="reading"
    >
      <section className="friend-profile">
        <div className="friend-profile__avatar">
          {(user.displayName ?? user.username).charAt(0)}
        </div>
        <div className="friend-profile__readout">
          <span>
            <small>身份</small>
            <strong>{user.profile?.title || "科协成员"}</strong>
          </span>
          <span>
            <small>公开记录</small>
            <strong>{user._count.posts} 篇</strong>
          </span>
          <span>
            <small>加入航线</small>
            <strong>{user.createdAt.toLocaleDateString("zh-CN")}</strong>
          </span>
        </div>
        {user.profile && (
          <div className="friend-profile__links">
            {user.profile.website && (
              <a href={user.profile.website} target="_blank" rel="noopener noreferrer">
                <Globe2 size={15} aria-hidden="true" />
                网站
              </a>
            )}
            {user.profile.github && (
              <a
                href={`https://github.com/${user.profile.github}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Code2 size={15} aria-hidden="true" />
                GitHub
              </a>
            )}
            {user.profile.bilibili && (
              <a
                href={`https://space.bilibili.com/${user.profile.bilibili}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PlaySquare size={15} aria-hidden="true" />
                B站
              </a>
            )}
          </div>
        )}
      </section>

      <InteriorSectionHeading title="发表的文章" meta={`${posts.length} 个知识光点`} />
      {posts.length === 0 ? (
        <InteriorEmpty>这位同行者还没有公开文章。</InteriorEmpty>
      ) : (
        <div className="post-signal-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} showExcerpt={false} />
          ))}
        </div>
      )}
    </InteriorPage>
  );
}
