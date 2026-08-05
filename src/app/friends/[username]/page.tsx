import { notFound } from "next/navigation";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { FriendProfilePostTabs } from "@/components/friends/friend-profile-post-tabs";
import { ProfileContactChannels } from "@/components/friends/profile-contact-channels";
import { prisma } from "@/lib/prisma";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";
import { safeWebsiteHref } from "@/modules/users/profile-links";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PersonalPage({ params }: Props) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username, role: { not: "GUEST" } },
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
  const avatar = user.avatar ?? user.profile?.avatarUrl;
  const roleLabel = user.role === "ADMIN" ? "科协管理员" : "科协成员";
  const gradeLabel = user.profile?.grade ? `${user.profile.grade} 级` : "年级未填写";

  return (
    <InteriorPage
      theme="routine"
      depth={copy.depth}
      section="同行者记录"
      title={name}
      description="每一位同行者，都在共同航线上留下自己的光。"
      contentWidth="wide"
    >
      <section className="friend-profile friend-profile--observatory">
        <div className="friend-profile__avatar-wrap">
          <span className="friend-profile__avatar-ring friend-profile__avatar-ring--outer" />
          <span className="friend-profile__avatar-ring friend-profile__avatar-ring--inner" />
          <div className="friend-profile__avatar">
            {avatar ? (
              <img src={avatar} alt={`${name}的头像`} />
            ) : (
              (user.displayName ?? user.username).charAt(0)
            )}
          </div>
          <span className="friend-profile__avatar-signal" aria-hidden="true" />
        </div>
        <div className="friend-profile__identity">
          <div className="friend-profile__identity-kicker">
            <span>FRIEND SIGNAL</span>
            <span className="friend-profile__role">{roleLabel}</span>
          </div>
          <h2>{name}</h2>
          <p className="friend-profile__username">@{user.username}</p>
          <p className="friend-profile__bio">
            {user.bio ?? "正在与同行者一起，把好奇变成可以抵达的航线。"}
          </p>
          <dl className="friend-profile__readout">
            <div>
              <dt>头衔</dt>
              <dd>{user.profile?.title || roleLabel}</dd>
            </div>
            <div>
              <dt>年级</dt>
              <dd>{gradeLabel}</dd>
            </div>
            <div>
              <dt>公开记录</dt>
              <dd>{user._count.posts} 篇</dd>
            </div>
            <div>
              <dt>加入航线</dt>
              <dd>{user.createdAt.toLocaleDateString("zh-CN")}</dd>
            </div>
          </dl>
        </div>
        <ProfileContactChannels
          website={user.profile?.website ?? null}
          websiteHref={safeWebsiteHref(user.profile?.website)}
          github={user.profile?.github ?? null}
          bilibili={user.profile?.bilibili ?? null}
          contactEmail={user.profile?.contactEmail ?? null}
          qq={user.profile?.qq ?? null}
          wechat={user.profile?.wechat ?? null}
        />
      </section>

      <InteriorSectionHeading title="发表的文章" meta={`${posts.length} 个知识光点`} />
      {posts.length === 0 ? (
        <InteriorEmpty>这位同行者还没有公开文章。</InteriorEmpty>
      ) : (
        <FriendProfilePostTabs posts={posts} />
      )}
    </InteriorPage>
  );
}
