"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

export default function NewEditorPage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [markdown, setMarkdown] = useState("");

  // 初始化 Milkdown Crepe 编辑器
  useEffect(() => {
    if (!editorRef.current || crepeRef.current) return;

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: "",
      features: {
        [CrepeFeature.CodeMirror]: true,
        [CrepeFeature.ImageBlock]: true,
        [CrepeFeature.Latex]: true,
        [CrepeFeature.Table]: true,
        [CrepeFeature.BlockEdit]: true,
        [CrepeFeature.Placeholder]: true,
        [CrepeFeature.Cursor]: true,
        [CrepeFeature.Slash]: true,
        [CrepeFeature.Toolbar]: true,
        [CrepeFeature.LinkTooltip]: true,
        [CrepeFeature.ListItem]: true,
      },
      featureConfigs: {
        [CrepeFeature.Placeholder]: {
          text: "开始写作…",
          mode: "block",
        },
      },
    });

    crepe.create().then(() => {
      crepeRef.current = crepe;
      setReady(true);

      // 监听 Markdown 变化
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
  }, []);

  const saveDraft = useCallback(async () => {
    if (!ready) return;
    setSaving(true);
    setMessage("");

    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "未命名文章",
        content: markdown,
        categoryId: categoryId || null,
        tags: tagList,
        postType: "ARTICLE",
      }),
    });

    setSaving(false);
    if (res.ok) {
      const post = await res.json();
      setMessage("草稿已保存");
      router.push(`/dashboard/editor/${post.id}`);
    } else {
      const err = await res.json();
      setMessage(`保存失败: ${err.error}`);
    }
  }, [ready, markdown, title, categoryId, tags, router]);

  const publish = useCallback(async () => {
    if (!ready) return;
    setSaving(true);
    setMessage("");

    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "未命名文章",
        content: markdown,
        categoryId: categoryId || null,
        tags: tagList,
        postType: "ARTICLE",
      }),
    });

    if (res.ok) {
      const post = await res.json();
      const pubRes = await fetch(`/api/posts/${post.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      setSaving(false);
      if (pubRes.ok) {
        setMessage("发布成功！");
        router.push("/dashboard/posts");
      } else {
        setMessage("发布失败");
      }
    } else {
      setSaving(false);
      const err = await res.json();
      setMessage(`保存失败: ${err.error}`);
    }
  }, [ready, markdown, title, categoryId, tags, router]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">写文章</h1>

      {/* 标题 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="文章标题…"
        className="w-full text-2xl font-bold text-[#1a1a1a] mb-4 px-4 py-2 border-b border-[#e8e0d5] focus:outline-none focus:border-[#8b5e3c] bg-transparent font-[family-name:var(--font-serif)]"
      />

      {/* Milkdown 编辑器 */}
      <div
        ref={editorRef}
        className="min-h-[500px] border border-[#e8e0d5] rounded-md mb-4 overflow-hidden"
      />

      {/* 配置区 */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">分类</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field w-full">
            <option value="">选择分类…</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">标签（逗号分隔）</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. 信号与系统, DSP"
            className="input-field w-full"
          />
        </div>
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-3">
        <button onClick={saveDraft} disabled={saving || !ready} className="btn-primary">
          {saving ? "保存中…" : "保存草稿"}
        </button>
        <button onClick={publish} disabled={saving || !ready} className="btn-primary">
          发布
        </button>
        {message && (
          <span className="text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">{message}</span>
        )}
      </div>
    </div>
  );
}
