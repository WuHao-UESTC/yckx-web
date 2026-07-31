"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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

export default function NewEditorPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      Placeholder.configure({ placeholder: "开始写作…" }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown,
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none min-h-[400px] px-8 py-6 focus:outline-none font-[family-name:var(--font-serif)] text-[#2c2c2c]",
      },
    },
  });

  const saveDraft = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    setMessage("");

    const content = editor.storage.markdown?.getMarkdown() ?? "";
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "未命名文章",
        content,
        categoryId: categoryId || null,
        tags: tagList,
        postType: "ARTICLE",
      }),
    });

    setSaving(false);
    if (res.ok) {
      const post = await res.json();
      setMessage(`草稿已保存 (slug: ${post.slug})`);
      router.push(`/dashboard/editor/${post.id}`);
    } else {
      const err = await res.json();
      setMessage(`保存失败: ${err.error}`);
    }
  }, [editor, title, categoryId, tags, router]);

  const publish = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    setMessage("");

    const content = editor.storage.markdown?.getMarkdown() ?? "";
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // First create as draft
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "未命名文章",
        content,
        categoryId: categoryId || null,
        tags: tagList,
        postType: "ARTICLE",
      }),
    });

    if (res.ok) {
      const post = await res.json();
      // Then publish
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
  }, [editor, title, categoryId, tags, router]);

  if (!editor) return null;

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

      {/* 工具栏 */}
      <div className="flex flex-wrap gap-1 mb-4 p-2 bg-[#faf7f2] rounded-md">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>B</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><em>I</em></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}><s>S</s></ToolBtn>
        <span className="mx-1 border-r border-[#e8e0d5]" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>H2</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>H3</ToolBtn>
        <span className="mx-1 border-r border-[#e8e0d5]" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>•</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>1.</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")}>☑</ToolBtn>
        <span className="mx-1 border-r border-[#e8e0d5]" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>❝</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}>&lt;/&gt;</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2 }).run()}>⊞</ToolBtn>
      </div>

      {/* 编辑器 */}
      <div className="border border-[#e8e0d5] rounded-md mb-4 bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* 配置区 */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">分类</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input-field w-full"
          >
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
        <button onClick={saveDraft} disabled={saving} className="btn-primary">
          {saving ? "保存中…" : "保存草稿"}
        </button>
        <button onClick={publish} disabled={saving} className="btn-primary">
          发布
        </button>
        {message && (
          <span className="text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">{message}</span>
        )}
      </div>
    </div>
  );
}

function ToolBtn({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
}) {
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
