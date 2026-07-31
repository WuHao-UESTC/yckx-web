"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

export default function EditPostPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [postSlug, setPostSlug] = useState("");

  // 加载文章
  useEffect(() => {
    async function load() {
      // 通过 slug 查找文章 - 暂时用 posts API 遍历
      // 更好的做法是有一个 GET /api/posts/by-id/[id] 端点
      const res = await fetch("/api/posts?status=all");
      const data = await res.json();
      const posts = data.items || [];
      const post = posts.find((p: { id: string }) => p.id === id);
      if (post) {
        setTitle(post.title || "");
        setCategoryId(post.categoryId || "");
        setTags(post.tags?.map((pt: { tag: { name: string } }) => pt.tag.name).join(", ") || "");
        setPostSlug(post.slug);
        setMarkdown(post.content || "");
        setLoading(false);
      } else {
        setMessage("文章未找到");
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // 初始化编辑器（等文章数据加载后）
  useEffect(() => {
    if (loading || !editorRef.current || crepeRef.current) return;

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: markdown,
      features: {
        [CrepeFeature.CodeMirror]: true,
        [CrepeFeature.ImageBlock]: true,
        [CrepeFeature.Latex]: true,
        [CrepeFeature.Table]: true,
        [CrepeFeature.BlockEdit]: true,
        [CrepeFeature.Placeholder]: true,
        [CrepeFeature.Cursor]: true,
      },
      featureConfigs: {
        [CrepeFeature.Placeholder]: { text: "继续写作…", mode: "block" },
      },
    });

    crepe.create().then(() => {
      crepeRef.current = crepe;
      setReady(true);
      crepe.on((listener) => {
        listener.markdownUpdated((_ctx, md) => {
          setMarkdown(md);
        });
      });
    });

    return () => {
      crepe.destroy();
      crepeRef.current = null;
    };
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async () => {
    if (!ready || !postSlug) return;
    setSaving(true);
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const res = await fetch(`/api/posts/${postSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "未命名文章",
        content: markdown,
        categoryId: categoryId || null,
        tags: tagList,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const post = await res.json();
      setPostSlug(post.slug);
      setMessage("已保存");
    } else {
      const err = await res.json();
      setMessage(`保存失败: ${err.error}`);
    }
  }, [ready, postSlug, markdown, title, categoryId, tags]);

  if (loading) {
    return <p className="text-[#6b6b6b] py-8 text-center">加载中…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">编辑文章</h1>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="文章标题…"
        className="w-full text-2xl font-bold text-[#1a1a1a] mb-4 px-4 py-2 border-b border-[#e8e0d5] focus:outline-none focus:border-[#8b5e3c] bg-transparent font-[family-name:var(--font-serif)]"
      />

      <div
        ref={editorRef}
        className="min-h-[500px] border border-[#e8e0d5] rounded-md mb-4 overflow-hidden"
      />

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving || !ready} className="btn-primary">
          {saving ? "保存中…" : "保存"}
        </button>
        <button onClick={() => router.push("/dashboard/posts")} className="btn-primary">
          返回列表
        </button>
        {message && (
          <span className="text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">{message}</span>
        )}
      </div>
    </div>
  );
}
