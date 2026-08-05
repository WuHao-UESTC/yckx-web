import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function DomainIndexItem({
  href,
  index,
  title,
  description,
  count,
  countLabel = "篇记录",
}: {
  href: string;
  index: number;
  title: string;
  description?: string | null;
  count?: number;
  countLabel?: string;
}) {
  return (
    <Link href={href} className="domain-index-item">
      <span className="domain-index-item__index">{String(index + 1).padStart(2, "0")}</span>
      <span className="domain-index-item__signal" aria-hidden="true" />
      <span className="domain-index-item__copy">
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      {typeof count === "number" && (
        <span className="domain-index-item__count">
          <strong>{count}</strong>
          <small>{countLabel}</small>
        </span>
      )}
      <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
  );
}
