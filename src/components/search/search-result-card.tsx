import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { postUrl } from "@/lib/post-url";
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

export function SearchResultCard({ post, query }: { post: SearchPost; query: string }) {
  return (
    <article className="post-signal group">
      <Link
        href={postUrl({
          slug: post.slug,
          category: { slug: post.categorySlug, type: post.categoryType },
        })}
        className="post-signal__link"
      >
        <span className="post-signal__beacon" aria-hidden="true" />
        <span className="post-signal__body">
          <h3>
            <HighlightText text={post.title} query={query} />
          </h3>
          {post.excerpt && (
            <p className="post-signal__excerpt">
              <HighlightText text={post.excerpt} query={query} />
            </p>
          )}
          <span className="post-signal__meta">
            <span>{post.authorDisplayName ?? post.authorUsername}</span>
            <time dateTime={post.publishedAt?.toISOString()}>
              {post.publishedAt?.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {post.categoryName && <span className="tag">{post.categoryName}</span>}
          </span>
        </span>
        <ArrowUpRight className="post-signal__arrow" size={17} aria-hidden="true" />
      </Link>
    </article>
  );
}
