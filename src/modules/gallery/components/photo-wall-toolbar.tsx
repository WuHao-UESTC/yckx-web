import Link from "next/link";
import { CalendarDays, RotateCcw, Search } from "lucide-react";

export function PhotoWallToolbar({ query }: { query: { q: string; from: string; to: string } }) {
  const hasFilters = Boolean(query.q || query.from || query.to);

  return (
    <form className="routine-photo-toolbar">
      <label className="routine-photo-toolbar__keyword">
        <Search size={16} aria-hidden="true" />
        <input name="photoQ" defaultValue={query.q} maxLength={100} placeholder="搜索照片描述" />
      </label>
      <label>
        <CalendarDays size={15} aria-hidden="true" />
        <span>从</span>
        <input name="photoFrom" type="date" defaultValue={query.from} />
      </label>
      <label>
        <span>至</span>
        <input name="photoTo" type="date" defaultValue={query.to} />
      </label>
      <button type="submit" className="btn-primary">
        搜索
      </button>
      {hasFilters && (
        <Link href="/routine#photo-wall" className="routine-photo-toolbar__reset" title="清除筛选">
          <RotateCcw size={16} aria-hidden="true" />
          <span className="sr-only">清除筛选</span>
        </Link>
      )}
    </form>
  );
}
