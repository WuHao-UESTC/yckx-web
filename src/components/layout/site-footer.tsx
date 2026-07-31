import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[#e8e0d5] bg-[#faf7f2]">
      <div className="mx-auto max-w-4xl px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
          &copy; {year} {SITE_NAME}. Built with care.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/friends"
            className="text-sm text-[#6b6b6b] hover:text-[#8b5e3c] transition-colors font-[family-name:var(--font-sans)]"
          >
            友链
          </Link>
          <Link
            href="/search"
            className="text-sm text-[#6b6b6b] hover:text-[#8b5e3c] transition-colors font-[family-name:var(--font-sans)]"
          >
            搜索
          </Link>
        </div>
      </div>
    </footer>
  );
}
