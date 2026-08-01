"use client";

interface Heading {
  level: number;
  text: string;
  line: number;
}

export function OutlinePanel({ markdown }: { markdown: string }) {
  const headings: Heading[] = [];
  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,4})\s+(.+)/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].replace(/[#*`~\[\]()]/g, "").trim(),
        line: i,
      });
    }
  }

  if (headings.length === 0) {
    return (
      <div className="p-3 text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)]">
        输入标题后自动生成大纲
      </div>
    );
  }

  return (
    <div className="text-xs font-[family-name:var(--font-sans)]">
      <p className="text-[#6b6b6b] mb-2 px-1 font-bold">文档大纲</p>
      {headings.map((h, i) => (
        <button
          key={i}
          className="block w-full text-left px-2 py-1 rounded hover:bg-[#f0ebe0] text-[#6b6b6b] hover:text-[#8b5e3c] transition-colors truncate"
          style={{ paddingLeft: `${8 + (h.level - 1) * 12}px` }}
          title={h.text}
        >
          {h.level === 1 && "▍"}
          {h.level === 2 && "▎"}
          {h.level >= 3 && "▏"}{" "}
          {h.text}
        </button>
      ))}
      <p className="text-[#c4a882] mt-2 px-1">{headings.length} 个标题</p>
    </div>
  );
}
