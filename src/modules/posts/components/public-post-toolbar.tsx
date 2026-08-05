import { ArrowUpDown, Search } from "lucide-react";
import type { PublicPostSort } from "../server/public-post-list";

export function PublicPostToolbar({
  query,
  sort,
  placeholder = "搜索文章标题或正文",
}: {
  query: string;
  sort: PublicPostSort;
  placeholder?: string;
}) {
  return (
    <form className="public-post-toolbar">
      <label className="public-post-toolbar__search">
        <Search size={16} aria-hidden="true" />
        <input name="q" defaultValue={query} maxLength={100} placeholder={placeholder} />
      </label>
      <label className="public-post-toolbar__sort">
        <ArrowUpDown size={15} aria-hidden="true" />
        <span className="sr-only">文章排序</span>
        <select name="sort" defaultValue={sort}>
          <option value="published">按发表日期</option>
          <option value="title">按拼音首字母</option>
        </select>
      </label>
      <button type="submit" className="btn-primary">
        搜索
      </button>
    </form>
  );
}
