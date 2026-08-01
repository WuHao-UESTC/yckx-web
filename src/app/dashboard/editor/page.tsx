"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { replaceAll } from "@milkdown/kit/utils";
import { OutlinePanel } from "@/components/editor/outline-panel";
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
  const mdRef = useRef(markdown);
  useEffect(() => { mdRef.current = markdown; }, [markdown]);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);

  // 加载分类列表
  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(console.error);
  }, []);

  // 初始化 Milkdown Crepe 编辑器
  useEffect(() => {
    if (!editorRef.current || crepeRef.current) return;

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: "",
      featureConfigs: {
        [CrepeFeature.Placeholder]: { text: "开始写作…", mode: "block" },
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

      // 拦截粘贴事件：含 $ 的文本直接以纯文本方式插入，防止解析器消耗 $ 符号
      const pasteHandler = (e: ClipboardEvent) => {
        const text = e.clipboardData?.getData("text/plain");
        if (text?.includes("$")) {
          e.preventDefault();
          e.stopPropagation();
          const updated = mdRef.current + text;
          setMarkdown(updated);
          crepe.editor.action(replaceAll(updated));
        }
      };
      editorRef.current?.addEventListener("paste", pasteHandler, true);
    });

    return () => {
      crepe.destroy();
      crepeRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    // 先创建
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
      // 再发布
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

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 100px)" }}>
      <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">写文章</h1>

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
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field w-full text-sm">
            <option value="">选择分类…</option>
            {Object.entries(groupedCategories).map(([type, cats]) => (
              <optgroup key={type} label={typeLabels[type] || type}>
                {cats.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="标签，逗号分隔"
            className="input-field w-full text-sm"
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
        {/* Milkdown 编辑器 */}
        <div ref={editorRef} className="flex-1 border border-[#e8e0d5] rounded-md overflow-auto min-w-0" />
        {/* 右侧大纲面板 */}
        <div className="hidden lg:block w-48 shrink-0 border border-[#e8e0d5] rounded-md p-3 overflow-y-auto bg-white">
          <OutlinePanel markdown={markdown} editorRef={editorRef} />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-3 mt-2">
        <button onClick={saveDraft} disabled={saving || !ready} className="btn-primary">
          {saving ? "保存中…" : "保存草稿"}
        </button>
        <button onClick={publish} disabled={saving || !ready} className="btn-primary bg-[#5a8a6a]">
          发布
        </button>
        {message && (
          <span className="text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">{message}</span>
        )}
      </div>
    </div>
  );
}
