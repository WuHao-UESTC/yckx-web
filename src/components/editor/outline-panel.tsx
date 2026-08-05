"use client";

import { useState, useMemo } from "react";

interface Heading {
  level: number;
  text: string;
  line: number;
  children: Heading[];
}

function buildTree(headings: { level: number; text: string; line: number }[]): Heading[] {
  const root: Heading[] = [];
  const stack: Heading[] = [];
  for (const h of headings) {
    const node: Heading = { ...h, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  }
  return root;
}

export function OutlinePanel({
  markdown,
  editorRef,
}: {
  markdown: string;
  editorRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const tree = useMemo(() => {
    const lines = markdown.split("\n");
    const headings: { level: number; text: string; line: number }[] = [];
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
    return buildTree(headings);
  }, [markdown]);

  const toggleCollapse = (line: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  };

  const jumpTo = (text: string) => {
    if (!editorRef?.current) return;
    const container = editorRef.current;
    // 查找编辑器内的标题元素
    const headings = container.querySelectorAll("h1, h2, h3, h4");
    for (const el of headings) {
      if (el.textContent?.trim() === text) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  };

  function renderNodes(nodes: Heading[], depth: number = 0): React.ReactNode {
    return nodes.map((h) => {
      const isCollapsed = collapsed.has(h.line);
      const hasChildren = h.children.length > 0;
      return (
        <div key={h.line}>
          <button
            className="flex items-center w-full text-left px-1 py-0.5 rounded hover:bg-[#f0ebe0] text-[#6b6b6b] hover:text-[#8b5e3c] transition-colors group"
            style={{ paddingLeft: `${4 + depth * 12}px` }}
            onClick={() => jumpTo(h.text)}
            title={`跳转到: ${h.text}`}
          >
            {hasChildren && (
              <span
                className="shrink-0 w-4 text-[#c4a882] hover:text-[#8b5e3c] cursor-pointer mr-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(h.line);
                }}
              >
                {isCollapsed ? "▸" : "▾"}
              </span>
            )}
            {!hasChildren && <span className="shrink-0 w-4 mr-0.5" />}
            <span className="truncate group-hover:text-[#8b5e3c]">
              {h.level === 1 && "H1 "}
              {h.text}
            </span>
          </button>
          {hasChildren && !isCollapsed && <div>{renderNodes(h.children, depth + 1)}</div>}
        </div>
      );
    });
  }

  if (tree.length === 0) {
    return (
      <div className="p-2 text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)]">
        输入 # 标题后自动生成
      </div>
    );
  }

  return (
    <div className="text-xs font-[family-name:var(--font-sans)]">
      <p className="text-[#6b6b6b] mb-2 font-bold">大纲</p>
      {renderNodes(tree)}
    </div>
  );
}
