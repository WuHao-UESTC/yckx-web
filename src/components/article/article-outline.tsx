"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { slugify } from "@/lib/slugify";

interface Heading {
  level: number;
  text: string;
  id: string;
  line: number;
  children: Heading[];
}

/** 从 markdown 文本解析标题列表 */
function parseHeadings(markdown: string): { level: number; text: string; line: number }[] {
  const lines = markdown.split("\n");
  const headings: { level: number; text: string; line: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,4})\s+(.+)/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].replace(/[#*`~\[\]()（）「」『』【】《》"']/g, "").trim(),
        line: i,
      });
    }
  }
  return headings;
}

/** 将平铺的标题列表构建为树形结构 */
function buildTree(headings: { level: number; text: string; line: number }[]): Heading[] {
  const root: Heading[] = [];
  const stack: Heading[] = [];
  for (const h of headings) {
    const node: Heading = {
      ...h,
      id: `h${h.level}-${slugify(h.text)}`,
      children: [],
    };
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

/** 当前正在阅读的标题 id（用于高亮） */
function useActiveHeading(tree: Heading[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // 收集所有标题 id（按 DOM 顺序）
    const ids = new Set<string>();
    function collect(nodes: Heading[]) {
      for (const h of nodes) {
        ids.add(h.id);
        collect(h.children);
      }
    }
    collect(tree);
    if (ids.size === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 找到第一个进入视口（或接近顶部）的标题
        let topMost: { id: string; top: number } | null = null;
        for (const entry of entries) {
          const rect = entry.boundingClientRect;
          // 只关心在视口上方或视口内的标题
          if (rect.top <= 120) {
            if (!topMost || rect.top > topMost.top) {
              topMost = { id: entry.target.id, top: rect.top };
            }
          }
        }
        if (topMost) {
          setActive(topMost.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    const els: Element[] = [];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        els.push(el);
      }
    }

    return () => {
      for (const el of els) observer.unobserve(el);
    };
  }, [tree]);

  return active;
}

export function ArticleOutline({ content }: { content: string }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const tree = useMemo(() => {
    const headings = parseHeadings(content);
    return buildTree(headings);
  }, [content]);

  const activeId = useActiveHeading(tree);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const jumpTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (tree.length === 0) return null;

  function renderNodes(nodes: Heading[], depth: number = 0): React.ReactNode {
    return nodes.map((h) => {
      const isCollapsed = collapsed.has(h.id);
      const hasChildren = h.children.length > 0;
      const isActive = activeId === h.id;

      return (
        <div key={h.id}>
          <div
            className={`article-outline__row${isActive ? " is-active" : ""}`}
            style={{ paddingLeft: `${6 + depth * 14}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                className="article-outline__toggle"
                onClick={() => toggleCollapse(h.id)}
                aria-label={isCollapsed ? `展开 ${h.text}` : `折叠 ${h.text}`}
              >
                {isCollapsed ? (
                  <ChevronRight size={13} aria-hidden="true" />
                ) : (
                  <ChevronDown size={13} aria-hidden="true" />
                )}
              </button>
            ) : (
              <span className="article-outline__toggle" aria-hidden="true" />
            )}
            <button
              type="button"
              className="article-outline__jump"
              onClick={() => jumpTo(h.id)}
              title={h.text}
            >
              {h.text}
            </button>
          </div>
          {hasChildren && !isCollapsed && <div>{renderNodes(h.children, depth + 1)}</div>}
        </div>
      );
    });
  }

  return (
    <nav className="article-outline" aria-label="文章大纲">
      <p>目录</p>
      <div>{renderNodes(tree)}</div>
    </nav>
  );
}
