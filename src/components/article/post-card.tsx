import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category, Column, Post, Tag, User } from "@/generated/prisma/client";
import { postUrl } from "@/lib/post-url";

/** 文章卡片最小所需字段 */
export type PostCardData = Post & {
  author: Pick<User, "id" | "username" | "displayName"> & Partial<Pick<User, "avatar">>;
  category?: Pick<Category, "id" | "name" | "slug" | "type"> | null;
  column?: Pick<Column, "id" | "title" | "slug" | "type"> | null;
  tags?: { tag: Pick<Tag, "id" | "name" | "slug"> }[];
};

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
    <article className="post-signal group">
      <Link href={postUrl(post)} className="post-signal__link">
        <span className="post-signal__beacon" aria-hidden="true" />
        <span className="post-signal__body">
          <h3>{post.title}</h3>
          {showExcerpt && post.excerpt && <p className="post-signal__excerpt">{post.excerpt}</p>}
          <span className="post-signal__meta">
            <span>{post.author.displayName ?? post.author.username}</span>
            <time dateTime={post.publishedAt?.toISOString()}>
              {post.publishedAt?.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {post.category && <span className="tag">{post.category.name}</span>}
            {post.column && <span className="tag">{post.column.title}</span>}
            {showTags &&
              tags.slice(0, maxTags).map((pt) => (
                <span key={pt.tag.id} className="tag">
                  {pt.tag.name}
                </span>
              ))}
          </span>
        </span>
        <ArrowUpRight className="post-signal__arrow" size={17} aria-hidden="true" />
      </Link>
    </article>
  );
}
