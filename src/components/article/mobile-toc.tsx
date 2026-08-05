"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { slugify } from "@/lib/slugify";

interface Heading {
  level: number;
  text: string;
  id: string;
  children: Heading[];
}

function parseHeadings(markdown: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  for (const line of markdown.split("\n")) {
    const match = line.match(/^(#{1,4})\s+(.+)/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].replace(/[#*`~\[\]()（）「」『』【】《》"']/g, "").trim(),
      });
    }
  }
  return headings;
}

/** 空间不足以容纳视口侧栏时使用的顶部可折叠目录 */
export function MobileTOC({ content }: { content: string }) {
  const [open, setOpen] = useState(false);

  const headings = useMemo(() => {
    const raw = parseHeadings(content);
    return raw.map((h) => ({
      ...h,
      id: `h${h.level}-${slugify(h.text)}`,
      children: [] as Heading[],
    }));
  }, [content]);

  const jumpTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpen(false);
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <div className="mobile-toc">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mobile-toc__trigger"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown size={16} aria-hidden="true" />
        ) : (
          <ChevronRight size={16} aria-hidden="true" />
        )}
        <span>目录</span>
        <small>{headings.length} 个标题</small>
      </button>
      {open && (
        <nav className="mobile-toc__list" aria-label="文章目录">
          {headings.map((h) => (
            <button
              type="button"
              key={h.id}
              className="mobile-toc__item"
              style={{ paddingLeft: `${8 + (h.level - 1) * 14}px` }}
              onClick={() => jumpTo(h.id)}
            >
              {h.text}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
