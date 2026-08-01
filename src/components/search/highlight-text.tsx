"use client";

import { useMemo } from "react";

/**
 * 将文本中匹配的关键词用 <mark> 标签高亮。
 * 支持多个关键词（空格分隔），不区分大小写。
 */
export function HighlightText({ text, query }: { text: string; query: string }) {
  const parts = useMemo(() => {
    const keywords = query
      .trim()
      .split(/\s+/)
      .filter((k) => k.length > 0);

    if (keywords.length === 0) return [{ text, match: false }];

    // 构建正则：任一关键词
    const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    const result: { text: string; match: boolean }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ text: text.slice(lastIndex, match.index), match: false });
      }
      result.push({ text: match[0], match: true });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), match: false });
    }
    return result.length > 0 ? result : [{ text, match: false }];
  }, [text, query]);

  return (
    <>
      {parts.map((part, i) =>
        part.match ? (
          <mark key={i} className="bg-[#f0e4cc] text-[#8b5e3c] rounded-sm px-0.5">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}
