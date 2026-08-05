import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__identity">
          <strong>{SITE_NAME}</strong>
          <p>UESTC HONORS COLLEGE · {year}</p>
        </div>
        <div className="site-footer__links">
          <Link href="/knowledge-base">知识库</Link>
          <Link href="/friends">同行者</Link>
          <Link href="/search">搜索</Link>
        </div>
      </div>
    </footer>
  );
}
