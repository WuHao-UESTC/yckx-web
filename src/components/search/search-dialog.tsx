"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { HighlightText } from "./highlight-text";

interface SearchResult {
  slug: string;
  title: string;
  excerpt: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryType: string | null;
}

function resultUrl(result: SearchResult): string {
  if (result.categoryType === "COMPETITION") {
    return `/competition/${result.categorySlug ?? "uncategorized"}/${result.slug}`;
  }
  if (result.categoryType === "NEWS") return `/news/${result.slug}`;
  if (result.categoryType === "EVENT") return `/events/${result.slug}`;
  return `/knowledge-base/${result.categorySlug ?? "uncategorized"}/${result.slug}`;
}

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        setQuery("");
        setResults([]);
        setSelectedIdx(0);
      }
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const doSearch = useCallback(async (value: string) => {
    if (value.trim().length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const openResult = (result: SearchResult) => {
    router.push(resultUrl(result));
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIdx((index) => Math.min(index + 1, results.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIdx((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && results[selectedIdx]) {
      openResult(results[selectedIdx]);
    }
  };

  if (!open) return null;

  return (
    <div className="search-dialog" role="dialog" aria-modal="true" aria-label="搜索站内内容">
      <button
        type="button"
        className="search-dialog__backdrop"
        onClick={() => setOpen(false)}
        aria-label="关闭搜索"
      />
      <div className="search-dialog__panel">
        <div className="search-dialog__input-row">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜索知识、竞赛、新闻或活动"
            aria-label="搜索关键词"
          />
          <kbd>ESC</kbd>
        </div>

        <div className="search-dialog__results">
          {loading && <p className="search-dialog__state">正在探测内容...</p>}
          {!loading && query && results.length === 0 && (
            <p className="search-dialog__state">没有找到相关内容</p>
          )}
          {!loading && !query && <p className="search-dialog__state">输入关键词开始搜索</p>}
          {results.map((result, index) => (
            <button
              key={`${result.categoryType}-${result.slug}`}
              type="button"
              className={`search-dialog__result ${index === selectedIdx ? "is-selected" : ""}`}
              onClick={() => openResult(result)}
              onMouseEnter={() => setSelectedIdx(index)}
            >
              <p>
                <HighlightText text={result.title} query={query} />
              </p>
              {result.excerpt && (
                <p>
                  <HighlightText text={result.excerpt} query={query} />
                </p>
              )}
            </button>
          ))}
        </div>

        <div className="search-dialog__footer">
          <span>↑↓ 选择</span>
          <span>Enter 打开</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  );
}
