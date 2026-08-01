import Link from "next/link";
import { postUrl, type PostCardData } from "./post-card";

interface Props {
  prev: PostCardData | null;
  next: PostCardData | null;
}

export function PostNav({ prev, next }: Props) {
  if (!prev && !next) return null;

  return (
    <nav
      className="mt-10 pt-6 border-t border-[#e8e0d5] grid grid-cols-2 gap-4 font-[family-name:var(--font-sans)]"
      aria-label="文章导航"
    >
      <div>
        {prev ? (
          <Link href={postUrl(prev)} className="block group">
            <span className="text-xs text-[#6b6b6b]">← 上一篇</span>
            <p className="text-sm text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors mt-0.5 line-clamp-1">
              {prev.title}
            </p>
          </Link>
        ) : (
          <span className="text-xs text-[#c4a882]">已是第一篇</span>
        )}
      </div>
      <div className="text-right">
        {next ? (
          <Link href={postUrl(next)} className="block group">
            <span className="text-xs text-[#6b6b6b]">下一篇 →</span>
            <p className="text-sm text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors mt-0.5 line-clamp-1">
              {next.title}
            </p>
          </Link>
        ) : (
          <span className="text-xs text-[#c4a882]">已是最后一篇</span>
        )}
      </div>
    </nav>
  );
}
