"use client";

import { useState, useMemo, useCallback } from "react";
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

/** 移动端顶部可折叠目录，仅在 <lg 断点显示 */
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
    <div className="lg:hidden mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-bold text-[#8b5e3c] py-2 px-3 rounded-md border border-[#e8e0d5] bg-[#faf7f2] hover:bg-[#f0ebe0] transition-colors font-[family-name:var(--font-sans)] w-full"
      >
        <span>{open ? "▾" : "▸"}</span>
        <span>目录</span>
        <span className="text-xs text-[#6b6b6b] ml-auto">{headings.length} 个标题</span>
      </button>
      {open && (
        <nav className="mt-2 p-3 border border-[#e8e0d5] rounded-md bg-[#faf7f2] max-h-[50vh] overflow-y-auto">
          {headings.map((h) => (
            <button
              key={h.id}
              className="block w-full text-left px-1.5 py-1 text-sm text-[#6b6b6b] hover:text-[#8b5e3c] hover:bg-[#f0ebe0]/50 rounded transition-colors font-[family-name:var(--font-sans)] truncate"
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
