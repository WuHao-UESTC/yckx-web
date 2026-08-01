"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HighlightText } from "./highlight-text";

interface SearchResult {
  slug: string;
  title: string;
  excerpt: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryType: string | null;
}

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ⌘K / Ctrl+K 唤起
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setResults([]);
        setSelectedIdx(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // 自动聚焦
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // 防抖搜索
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIdx]) {
      const r = results[selectedIdx];
      const url = r.categoryType === "COMPETITION"
        ? `/competition/${r.categorySlug ?? "uncategorized"}/${r.slug}`
        : r.categoryType === "EVENT"
        ? `/events/${r.slug}`
        : `/knowledge-base/${r.categorySlug ?? "uncategorized"}/${r.slug}`;
      router.push(url);
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40" />
      {/* 对话框 */}
      <div
        className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-[#e8e0d5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 输入框 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e8e0d5]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章…"
            className="flex-1 text-sm outline-none bg-transparent font-[family-name:var(--font-sans)]"
          />
          <kbd className="text-[10px] text-[#6b6b6b] bg-[#f5f0e8] px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* 结果列表 */}
        <div className="max-h-[360px] overflow-y-auto">
          {loading && (
            <p className="px-4 py-6 text-center text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">搜索中…</p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">未找到结果</p>
          )}
          {!loading && !query && (
            <p className="px-4 py-6 text-center text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">输入关键词开始搜索</p>
          )}
          {results.map((r, i) => (
            <button
              key={r.slug}
              className={`w-full text-left px-4 py-2.5 hover:bg-[#f5f0e8] transition-colors border-b border-[#e8e0d5] last:border-b-0 ${i === selectedIdx ? "bg-[#f0ebe0]" : ""}`}
              onClick={() => {
                const url = r.categoryType === "COMPETITION"
                  ? `/competition/${r.categorySlug ?? "uncategorized"}/${r.slug}`
                  : r.categoryType === "EVENT"
                  ? `/events/${r.slug}`
                  : `/knowledge-base/${r.categorySlug ?? "uncategorized"}/${r.slug}`;
                router.push(url);
                setOpen(false);
              }}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <p className="text-sm font-bold text-[#1a1a1a] line-clamp-1">
                <HighlightText text={r.title} query={query} />
              </p>
              {r.excerpt && (
                <p className="text-xs text-[#6b6b6b] line-clamp-1 mt-0.5 font-[family-name:var(--font-sans)]">
                  <HighlightText text={r.excerpt} query={query} />
                </p>
              )}
            </button>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 border-t border-[#e8e0d5] flex gap-4 text-[10px] text-[#6b6b6b] font-[family-name:var(--font-sans)]">
          <span>↑↓ 导航</span>
          <span>↵ 打开</span>
          <span>ESC 关闭</span>
        </div>
      </div>
    </div>
  );
}
