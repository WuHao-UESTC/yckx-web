import Link from "next/link";
import { HighlightText } from "./highlight-text";

interface SearchPost {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  authorUsername: string;
  authorDisplayName: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryType: string | null;
}

function postUrl(post: SearchPost): string {
  if (post.categoryType === "COMPETITION")
    return `/competition/${post.categorySlug ?? "uncategorized"}/${post.slug}`;
  if (post.categoryType === "EVENT") return `/events/${post.slug}`;
  return `/knowledge-base/${post.categorySlug ?? "uncategorized"}/${post.slug}`;
}

export function SearchResultCard({ post, query }: { post: SearchPost; query: string }) {
  return (
    <article className="card group">
      <Link href={postUrl(post)}>
        <h3 className="text-lg font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors leading-snug">
          <HighlightText text={post.title} query={query} />
        </h3>
        {post.excerpt && (
          <p className="text-sm text-[#6b6b6b] line-clamp-2 mt-1.5 leading-relaxed font-[family-name:var(--font-sans)]">
            <HighlightText text={post.excerpt} query={query} />
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#6b6b6b] mt-2.5 font-[family-name:var(--font-sans)]">
          <span>{post.authorDisplayName ?? post.authorUsername}</span>
          <span>·</span>
          <time dateTime={post.publishedAt?.toISOString()}>
            {post.publishedAt?.toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          {post.categoryName && (
            <>
              <span>·</span>
              <span className="tag">{post.categoryName}</span>
            </>
          )}
        </div>
      </Link>
    </article>
  );
}
