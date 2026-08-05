import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { postUrl, type RoutablePost } from "@/lib/post-url";

type AdjacentPost = RoutablePost & { title: string };

interface Props {
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
}

export function PostNav({ prev, next }: Props) {
  if (!prev && !next) return null;

  return (
    <nav className="article-post-nav" aria-label="文章导航">
      <div className="article-post-nav__previous">
        {prev ? (
          <Link href={postUrl(prev)}>
            <span>
              <ArrowLeft size={14} aria-hidden="true" /> 上一篇
            </span>
            <p>{prev.title}</p>
          </Link>
        ) : (
          <span className="article-post-nav__empty">已是第一篇</span>
        )}
      </div>
      <div className="article-post-nav__next">
        {next ? (
          <Link href={postUrl(next)}>
            <span>
              下一篇 <ArrowRight size={14} aria-hidden="true" />
            </span>
            <p>{next.title}</p>
          </Link>
        ) : (
          <span className="article-post-nav__empty">已是最后一篇</span>
        )}
      </div>
    </nav>
  );
}
