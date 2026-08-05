import Link from "next/link";
import type { Post, User, Category, Tag } from "@/generated/prisma/client";

/** 文章卡片最小所需字段 */
export type PostCardData = Post & {
  author: Pick<User, "id" | "username" | "displayName"> & Partial<Pick<User, "avatar">>;
  category?: Pick<Category, "id" | "name" | "slug" | "type"> | null;
  tags?: { tag: Pick<Tag, "id" | "name" | "slug"> }[];
};

export type RoutablePost = {
  slug: string;
  category?: Pick<Category, "slug" | "type"> | null;
};

/** 根据文章分类类型生成文章链接 */
export function postUrl(post: RoutablePost): string {
  const type = post.category?.type;
  const catSlug = post.category?.slug ?? "uncategorized";

  if (type === "COMPETITION") return `/competition/${catSlug}/${post.slug}`;
  if (type === "EVENT") return `/events/${post.slug}`;
  return `/knowledge-base/${catSlug}/${post.slug}`;
}

interface Props {
  post: PostCardData;
  /** 是否显示摘要，默认 true */
  showExcerpt?: boolean;
  /** 是否显示标签，默认 false */
  showTags?: boolean;
  /** 最多显示标签数 */
  maxTags?: number;
}

export function PostCard({ post, showExcerpt = true, showTags = false, maxTags = 2 }: Props) {
  const tags = post.tags ?? [];

  return (
    <article className="card group">
      <Link href={postUrl(post)}>
        <h3 className="text-lg font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors leading-snug">
          {post.title}
        </h3>
        {showExcerpt && post.excerpt && (
          <p className="text-sm text-[#6b6b6b] line-clamp-2 mt-1.5 leading-relaxed font-[family-name:var(--font-sans)]">
            {post.excerpt}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#6b6b6b] mt-2.5 font-[family-name:var(--font-sans)]">
          <span>{post.author.displayName ?? post.author.username}</span>
          <span>·</span>
          <time dateTime={post.publishedAt?.toISOString()}>
            {post.publishedAt?.toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          {post.category && (
            <>
              <span>·</span>
              <span className="tag">{post.category.name}</span>
            </>
          )}
          {showTags && tags.length > 0 && (
            <>
              {tags.slice(0, maxTags).map((pt) => (
                <span key={pt.tag.id} className="tag">
                  {pt.tag.name}
                </span>
              ))}
            </>
          )}
        </div>
      </Link>
    </article>
  );
}
