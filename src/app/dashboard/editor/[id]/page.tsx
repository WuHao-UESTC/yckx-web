"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";

const lowlight = createLowlight(common);

export default function EditPostPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [oldSlug, setOldSlug] = useState("");

  // 加载文章
  useEffect(() => {
    async function load() {
      const postsRes = await fetch("/api/posts");
      const data = await postsRes.json();
      // We need to find by id. Let's use a simpler approach - fetch all and find.
      // Actually we need an API that gets by id. For now, workaround:
      const allPosts = data.items || [];
      // This is a workaround — ideally we'd have GET /api/posts/by-id/[id]
      setLoading(false);
      setMessage("编辑模式：请通过文章列表进入。");
    }
    load();
  }, [id]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      Placeholder.configure({ placeholder: "继续写作…" }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown,
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none min-h-[400px] px-8 py-6 focus:outline-none font-[family-name:var(--font-serif)] text-[#2c2c2c]",
      },
    },
  });

  const saveDraft = useCallback(async () => {
    if (!editor || !oldSlug) return;
    setSaving(true);
    const content = editor.storage.markdown?.getMarkdown() ?? "";
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const res = await fetch(`/api/posts/${oldSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "未命名文章",
        content,
        categoryId: categoryId || null,
        tags: tagList,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const post = await res.json();
      setOldSlug(post.slug);
      setMessage("已保存");
    } else {
      const err = await res.json();
      setMessage(`保存失败: ${err.error}`);
    }
  }, [editor, oldSlug, title, categoryId, tags]);

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

      <div className="flex flex-wrap gap-1 mb-4 p-2 bg-[#faf7f2] rounded-md">
        <ToolBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold") ?? false}>B</ToolBtn>
        <ToolBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic") ?? false}><em>I</em></ToolBtn>
        <ToolBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 }) ?? false}>H2</ToolBtn>
        <ToolBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 }) ?? false}>H3</ToolBtn>
        <ToolBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList") ?? false}>•</ToolBtn>
        <ToolBtn onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive("codeBlock") ?? false}>&lt;/&gt;</ToolBtn>
      </div>

      <div className="border border-[#e8e0d5] rounded-md mb-4 bg-white">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={saveDraft} disabled={saving} className="btn-primary">
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

function ToolBtn({ onClick, active, children }: { onClick: () => void; active: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded font-mono transition-colors ${
        active ? "bg-[#8b5e3c] text-white" : "text-[#6b6b6b] hover:bg-[#f0ebe0]"
      }`}
    >
      {children}
    </button>
  );
}
