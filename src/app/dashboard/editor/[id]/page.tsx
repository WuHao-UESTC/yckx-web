"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { replaceAll } from "@milkdown/kit/utils";
import { OutlinePanel } from "@/components/editor/outline-panel";
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
  const [postStatus, setPostStatus] = useState("DRAFT");
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);

  // 加载分类列表
  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(console.error);
  }, []);

  // 加载文章
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/posts?status=all");
      const data = await res.json();
      const posts = data.items || [];
      const post = posts.find((p: { id: string }) => p.id === id);
      if (post) {
        setTitle(post.title || "");
        setCategoryId(post.categoryId || "");
        setTags(post.tags?.map((pt: { tag: { name: string } }) => pt.tag.name).join(", ") || "");
        setPostSlug(post.slug);
        setPostStatus(post.status);
        setMarkdown(post.content || "");
        setLoading(false);
      } else {
        setMessage("文章未找到");
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // 初始化编辑器
  useEffect(() => {
    if (loading || !editorRef.current || crepeRef.current) return;

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: markdown,
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

  const save = useCallback(async (status?: string) => {
    if (!ready || !postSlug) return;
    setSaving(true);
    setMessage("");
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const body: Record<string, unknown> = {
      title: title || "未命名文章",
      content: markdown,
      categoryId: categoryId || null,
      tags: tagList,
    };
    if (status) body.status = status;

    const res = await fetch(`/api/posts/${postSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const post = await res.json();
      setPostSlug(post.slug);
      setPostStatus(post.status);
      setMessage(status === "PUBLISHED" ? "已发布！" : "已保存");
    } else {
      const err = await res.json();
      setMessage(`保存失败: ${err.error}`);
    }
  }, [ready, postSlug, markdown, title, categoryId, tags]);

  const deletePost = useCallback(async () => {
    if (!confirm("确定要永久删除这篇文章吗？此操作不可撤销。")) return;
    setSaving(true);
    const res = await fetch(`/api/posts/${postSlug}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) {
      router.push("/dashboard/posts");
    } else {
      setMessage("删除失败");
    }
  }, [postSlug, router]);

  const insertTemplate = useCallback((tmpl: string) => {
    if (!crepeRef.current) return;
    const updated = markdown + tmpl;
    setMarkdown(updated);
    crepeRef.current.editor.action(replaceAll(updated));
  }, [markdown]);

  const groupedCategories: Record<string, typeof categories> = {};
  for (const c of categories) {
    if (!groupedCategories[c.type]) groupedCategories[c.type] = [];
    groupedCategories[c.type].push(c);
  }
  const typeLabels: Record<string, string> = { KNOWLEDGE: "知识", COMPETITION: "竞赛", EVENT: "事件" };

  if (loading) {
    return <p className="text-[#6b6b6b] py-8 text-center">加载中…</p>;
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 100px)" }}>
      <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">编辑文章</h1>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="文章标题…"
        className="w-full text-2xl font-bold text-[#1a1a1a] mb-2 px-4 py-2 border-b border-[#e8e0d5] focus:outline-none focus:border-[#8b5e3c] bg-transparent font-[family-name:var(--font-serif)]"
      />

      {/* 分类与标签 */}
      <div className="grid gap-2 sm:grid-cols-2 mb-2">
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">分类</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field w-full">
            <option value="">选择分类…</option>
            {Object.entries(groupedCategories).map(([type, cats]) => (
              <optgroup key={type} label={typeLabels[type] || type}>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            ))}
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

      {/* 工具栏：格式 + 插入 */}
      <div className="flex flex-wrap gap-1 mb-2 font-[family-name:var(--font-sans)] text-xs">
        <span className="text-[#6b6b6b] py-1 mr-1">格式：</span>
        <button onClick={() => insertTemplate("****")} className="px-2 py-1 rounded border border-[#e8e0d5] hover:bg-[#f0ebe0] text-[#2c2c2c] transition-colors"><strong>B</strong></button>
        <button onClick={() => insertTemplate("**")} className="px-2 py-1 rounded border border-[#e8e0d5] hover:bg-[#f0ebe0] text-[#2c2c2c] transition-colors"><em>I</em></button>
        <button onClick={() => insertTemplate("~~~~")} className="px-2 py-1 rounded border border-[#e8e0d5] hover:bg-[#f0ebe0] text-[#2c2c2c] transition-colors"><s>S</s></button>
        <span className="mx-1 border-r border-[#e8e0d5]" />
        <button onClick={() => insertTemplate("> ")} className="px-2 py-1 rounded border border-[#e8e0d5] hover:bg-[#f0ebe0] text-[#8b5e3c] transition-colors">❝ 引用</button>
        <button onClick={() => insertTemplate("\n| 列A | 列B |\n|-----|-----|\n|     |     |\n")} className="px-2 py-1 rounded border border-[#e8e0d5] hover:bg-[#f0ebe0] text-[#8b5e3c] transition-colors">⊞ 表格</button>
        <button onClick={() => insertTemplate("$x^2$")} className="px-2 py-1 rounded border border-[#e8e0d5] hover:bg-[#f0ebe0] text-[#8b5e3c] transition-colors">ƒ 公式</button>
        <span className="mx-1 border-r border-[#e8e0d5]" />
        <span className="text-[#6b6b6b] py-1 mr-1">插入：</span>
        <button onClick={() => insertTemplate("\n```markmap\n- 思维导图\n  - 分支一\n  - 分支二\n```\n")} className="px-2 py-1 rounded border border-[#e8e0d5] hover:bg-[#f0ebe0] text-[#8b5e3c] transition-colors">🧠 思维导图</button>
        <button onClick={() => insertTemplate("\n```mermaid\ngraph TD\n  A[开始] --> B[结束]\n```\n")} className="px-2 py-1 rounded border border-[#e8e0d5] hover:bg-[#f0ebe0] text-[#8b5e3c] transition-colors">📊 图表</button>
        <button onClick={() => insertTemplate("\n```pdf\nhttps://example.com/file.pdf\n```\n")} className="px-2 py-1 rounded border border-[#e8e0d5] hover:bg-[#f0ebe0] text-[#8b5e3c] transition-colors">📄 PDF</button>
      </div>

      {/* 编辑区 + 大纲 */}
      <div className="flex gap-3 flex-1 min-h-0">
        <div ref={editorRef} className="flex-1 border border-[#e8e0d5] rounded-md overflow-hidden min-w-0" />
        <div className="hidden lg:block w-48 shrink-0 border border-[#e8e0d5] rounded-md p-3 overflow-y-auto bg-white">
          <OutlinePanel markdown={markdown} />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-3 flex-wrap mt-2">
        <button onClick={() => save()} disabled={saving || !ready} className="btn-primary">
          {saving ? "保存中…" : "保存草稿"}
        </button>
        {postStatus !== "PUBLISHED" && (
          <button onClick={() => save("PUBLISHED")} disabled={saving || !ready} className="btn-primary bg-[#5a8a6a]">
            发布
          </button>
        )}
        <button onClick={() => router.push("/dashboard/posts")} className="btn-primary">
          返回列表
        </button>
        <button onClick={deletePost} disabled={saving} className="btn-primary bg-red-500 hover:bg-red-600">
          删除
        </button>
        {message && (
          <span className="text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">{message}</span>
        )}
      </div>
    </div>
  );
}
