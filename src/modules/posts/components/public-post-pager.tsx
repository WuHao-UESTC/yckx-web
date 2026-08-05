import Link from "next/link";
import { publicPostListHref, type PublicPostSort } from "../server/public-post-list";

export function PublicPostPager({
  pathname,
  query,
  totalPages,
  label,
}: {
  pathname: string;
  query: { q: string; sort: PublicPostSort; page: number };
  totalPages: number;
  label: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="interior-pager" aria-label={label}>
      {query.page > 1 && (
        <Link
          href={publicPostListHref(pathname, { ...query, page: query.page - 1 })}
          className="btn-primary"
        >
          上一页
        </Link>
      )}
      {query.page < totalPages && (
        <Link
          href={publicPostListHref(pathname, { ...query, page: query.page + 1 })}
          className="btn-primary"
        >
          下一页
        </Link>
      )}
    </nav>
  );
}
