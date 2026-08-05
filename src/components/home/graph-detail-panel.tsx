"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GraphNode } from "./knowledge-graph";

interface PostItem {
  slug: string;
  title: string;
  publishedAt: string | null;
  author: { displayName: string | null; username: string };
  category: { slug: string; type: string } | null;
}

export function GraphDetailPanel({ selectedNode }: { selectedNode: GraphNode | null }) {
  const [result, setResult] = useState<{ slug: string; posts: PostItem[] } | null>(null);
  const categorySlug = selectedNode?.categorySlug ?? null;

  useEffect(() => {
    if (!categorySlug) return;

    const controller = new AbortController();

    fetch(`/api/graph-posts?slug=${encodeURIComponent(categorySlug)}&limit=5`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setResult({ slug: categorySlug, posts: data.posts || data.items || [] });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResult({ slug: categorySlug, posts: [] });
      });

    return () => controller.abort();
  }, [categorySlug]);

  const posts = result?.slug === categorySlug ? result.posts : [];
  const loading = Boolean(categorySlug && result?.slug !== categorySlug);

  const categoryUrl = selectedNode?.categorySlug
    ? selectedNode.type === "main" || selectedNode.type === "category"
      ? `/knowledge-base/${selectedNode.categorySlug}`
      : `/competition/${selectedNode.categorySlug}`
    : "#";

  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
        <p>← 点击左侧图谱节点查看详情</p>
      </div>
    );
  }

  return (
    <div className="font-[family-name:var(--font-sans)]">
      <h3 className="text-base font-bold text-[#1a1a1a] mb-3">{selectedNode.label}</h3>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded bg-[#f5f0e8] animate-pulse" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/${post.category?.type === "COMPETITION" ? "competition" : "knowledge-base"}/${post.category?.slug ?? "uncategorized"}/${post.slug}`}
              className="block px-2 py-1.5 rounded hover:bg-[#f5f0e8] transition-colors group"
            >
              <p className="text-sm text-[#1a1a1a] group-hover:text-[#8b5e3c] line-clamp-1 transition-colors">
                {post.title}
              </p>
              <p className="text-[10px] text-[#6b6b6b] mt-0.5">
                {post.author.displayName ?? post.author.username} ·{" "}
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("zh-CN") : ""}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#6b6b6b]">该分类暂无文章。</p>
      )}

      {/* 底部跳转按钮 */}
      <div className="mt-4 pt-3 border-t border-[#e8e0d5]">
        <Link
          href={categoryUrl}
          className="block text-center text-xs text-[#8b5e3c] hover:text-[#5a3a22] py-1 rounded border border-[#e8e0d5] hover:border-[#c4a882] transition-colors"
        >
          查看 {selectedNode.label} 全部内容 →
        </Link>
      </div>
    </div>
  );
}
