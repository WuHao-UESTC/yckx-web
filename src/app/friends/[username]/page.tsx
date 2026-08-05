import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/article/post-card";

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

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      {/* 个人信息卡片 */}
      <div className="card mb-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#f5f0e8] flex items-center justify-center text-3xl text-[#8b5e3c] font-bold mb-3">
          {(user.displayName ?? user.username).charAt(0)}
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">{user.displayName ?? user.username}</h1>
        {user.profile?.title && (
          <p className="text-[#8b5e3c] text-sm mt-1 font-[family-name:var(--font-sans)]">
            {user.profile.title}
          </p>
        )}
        {user.bio && (
          <p className="text-[#6b6b6b] text-sm mt-2 max-w-md mx-auto font-[family-name:var(--font-sans)]">
            {user.bio}
          </p>
        )}
        <div className="flex justify-center gap-4 mt-3 text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)]">
          <span>{user._count.posts} 篇文章</span>
          <span>·</span>
          <span>加入于 {user.createdAt.toLocaleDateString("zh-CN")}</span>
        </div>
        {user.profile && (
          <div className="flex justify-center gap-3 mt-3">
            {user.profile.website && (
              <a
                href={user.profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#8b5e3c]"
              >
                🌐 网站
              </a>
            )}
            {user.profile.github && (
              <a
                href={`https://github.com/${user.profile.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#8b5e3c]"
              >
                💻 GitHub
              </a>
            )}
            {user.profile.bilibili && (
              <a
                href={`https://space.bilibili.com/${user.profile.bilibili}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#8b5e3c]"
              >
                📺 B站
              </a>
            )}
          </div>
        )}
      </div>

      {/* 文章列表 */}
      <h2 className="text-xl font-bold text-[#1a1a1a] mb-4 pb-2 border-b border-[#e8e0d5]">
        发表的文章
      </h2>
      {posts.length === 0 ? (
        <p className="text-[#6b6b6b]">暂无文章。</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} showExcerpt={false} />
          ))}
        </div>
      )}
    </div>
  );
}
