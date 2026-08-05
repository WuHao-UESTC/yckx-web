"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { replaceAll } from "@milkdown/kit/utils";
import {
  Bold,
  FileText,
  GitBranch,
  Italic,
  Quote,
  Sigma,
  Strikethrough,
  Table2,
  Trash2,
  Upload,
  Workflow,
} from "lucide-react";
import { OutlinePanel } from "@/components/editor/outline-panel";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

export type EditorPostKind = "TECHNICAL" | "NEWS" | "DAILY";

type CategoryOption = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
};

type ColumnOption = {
  id: string;
  title: string;
  type: string;
  categoryId: string | null;
  isActive: boolean;
};

type Attachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type EditorInitialPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  kind: EditorPostKind;
  categoryId: string | null;
  columnId: string | null;
  technicalColumnIds: string[];
  renderStyle: "DEFAULT" | "TECHNICAL" | "PAPER";
  tags: string[];
  files: Attachment[];
};

const KIND_COPY: Record<
  EditorPostKind,
  { eyebrow: string; title: string; placeholder: string; accent: string }
> = {
  TECHNICAL: {
    eyebrow: "TECHNICAL CURRENT",
    title: "写技术文章",
    placeholder: "记录问题、方法、实验与结论…",
    accent: "technical",
  },
  NEWS: {
    eyebrow: "ARCHIVE DISPATCH",
    title: "写新闻",
    placeholder: "记录事件、人物、结果与必要背景…",
    accent: "news",
  },
  DAILY: {
    eyebrow: "DAILY LOG",
    title: "写日常专栏",
    placeholder: "写下这一阶段值得保留的经历与感悟…",
    accent: "daily",
  },
};

export function PostEditor({
  kind,
  categories,
  columns,
  initialPost,
}: {
  kind: EditorPostKind;
  categories: CategoryOption[];
  columns: ColumnOption[];
  initialPost?: EditorInitialPost;
}) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [categoryId, setCategoryId] = useState(initialPost?.categoryId ?? "");
  const [columnId, setColumnId] = useState(initialPost?.columnId ?? "");
  const [technicalColumnIds, setTechnicalColumnIds] = useState<string[]>(
    initialPost?.technicalColumnIds ?? []
  );
  const [renderStyle, setRenderStyle] = useState<"DEFAULT" | "TECHNICAL" | "PAPER">(
    initialPost?.renderStyle ?? "DEFAULT"
  );
  const [tags, setTags] = useState(initialPost?.tags.join(", ") ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(initialPost?.files ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [markdown, setMarkdown] = useState(initialPost?.content ?? "");
  const [postSlug, setPostSlug] = useState(initialPost?.slug ?? "");
  const [postStatus, setPostStatus] = useState(initialPost?.status ?? "DRAFT");
  const mdRef = useRef(markdown);
  const copy = KIND_COPY[kind];

  useEffect(() => {
    mdRef.current = markdown;
  }, [markdown]);

  useEffect(() => {
    if (!editorRef.current || crepeRef.current) return;

    const root = editorRef.current;
    const crepe = new Crepe({
      root,
      defaultValue: initialPost?.content ?? "",
      featureConfigs: {
        [CrepeFeature.Placeholder]: { text: copy.placeholder, mode: "block" },
      },
    });

    const pasteHandler = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text/plain");
      if (!text?.includes("$")) return;
      event.preventDefault();
      event.stopPropagation();
      const updated = mdRef.current + text;
      setMarkdown(updated);
      crepe.editor.action(replaceAll(updated));
    };

    void crepe.create().then(() => {
      crepeRef.current = crepe;
      setReady(true);
      crepe.on((listener) => {
        listener.markdownUpdated((_ctx, nextMarkdown) => setMarkdown(nextMarkdown));
      });
      root.addEventListener("paste", pasteHandler, true);
    });

    return () => {
      root.removeEventListener("paste", pasteHandler, true);
      void crepe.destroy();
      crepeRef.current = null;
    };
  }, [copy.placeholder, initialPost?.content]);

  const insertTemplate = useCallback(
    (template: string) => {
      if (!crepeRef.current) return;
      const updated = markdown + template;
      setMarkdown(updated);
      crepeRef.current.editor.action(replaceAll(updated));
    },
    [markdown]
  );

  const uploadAttachments = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const selectedFiles = Array.from(files).slice(0, Math.max(0, 20 - attachments.length));
      if (selectedFiles.length === 0) return;
      setUploading(true);
      setMessage("");

      try {
        const uploaded: Attachment[] = [];
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.set("file", file);
          formData.set("purpose", "ATTACHMENT");
          const response = await fetch("/api/files/upload", { method: "POST", body: formData });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? `无法上传 ${file.name}`);
          uploaded.push(result as Attachment);
        }
        setAttachments((current) => [...current, ...uploaded]);
        setMessage(`已上传 ${uploaded.length} 个附件，保存文章后完成绑定`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "附件上传失败");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [attachments.length]
  );

  const save = useCallback(
    async (status?: "PUBLISHED") => {
      if (!ready) return;
      setSaving(true);
      setMessage("");

      const payload = {
        title: title || "未命名文章",
        content: markdown,
        categoryId: categoryId || null,
        columnId: columnId || null,
        technicalColumnIds,
        renderStyle,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        kind,
        attachmentIds: attachments.map((file) => file.id),
        ...(status ? { status } : {}),
      };

      try {
        const response = await fetch(postSlug ? `/api/posts/${postSlug}` : "/api/posts", {
          method: postSlug ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "文章保存失败");

        let savedPost = result as { id: string; slug: string; status: typeof postStatus };
        setPostSlug(savedPost.slug);
        setPostStatus(savedPost.status);
        if (!postSlug && status === "PUBLISHED") {
          const publishResponse = await fetch(`/api/posts/${savedPost.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "PUBLISHED" }),
          });
          const publishResult = await publishResponse.json();
          if (!publishResponse.ok) throw new Error(publishResult.error ?? "文章发布失败");
          savedPost = publishResult;
        }

        setPostSlug(savedPost.slug);
        setPostStatus(savedPost.status);
        if (status === "PUBLISHED") {
          router.push("/dashboard/posts");
          router.refresh();
        } else if (!initialPost) {
          router.push(`/dashboard/editor/${savedPost.id}`);
        } else {
          setMessage("已保存");
          router.refresh();
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "文章保存失败");
      } finally {
        setSaving(false);
      }
    },
    [
      attachments,
      categoryId,
      columnId,
      initialPost,
      kind,
      markdown,
      postSlug,
      ready,
      renderStyle,
      router,
      tags,
      technicalColumnIds,
      title,
    ]
  );

  const removePost = useCallback(async () => {
    if (!postSlug || !window.confirm("确定删除这篇文章吗？附件将返回私有文件库。")) return;
    setSaving(true);
    const response = await fetch(`/api/posts/${postSlug}`, { method: "DELETE" });
    setSaving(false);
    if (response.ok) {
      router.push("/dashboard/posts");
      router.refresh();
    } else {
      const result = await response.json();
      setMessage(result.error ?? "删除失败");
    }
  }, [postSlug, router]);

  const toolButtons = [
    { label: "粗体", icon: Bold, template: "****" },
    { label: "斜体", icon: Italic, template: "**" },
    { label: "删除线", icon: Strikethrough, template: "~~~~" },
    { label: "引用", icon: Quote, template: "> " },
    { label: "表格", icon: Table2, template: "\n| 列A | 列B |\n| --- | --- |\n|     |     |\n" },
    { label: "公式", icon: Sigma, template: "$x^2$" },
    {
      label: "思维导图",
      icon: GitBranch,
      template: "\n```markmap\n- 思维导图\n  - 分支一\n  - 分支二\n```\n",
    },
    {
      label: "流程图",
      icon: Workflow,
      template: "\n```mermaid\ngraph TD\n  A[开始] --> B[结束]\n```\n",
    },
    {
      label: "PDF 嵌入",
      icon: FileText,
      template: "\n```pdf\nhttps://example.com/file.pdf\n```\n",
    },
  ] as const;

  return (
    <div className="workspace-editor flex flex-col" data-editor-kind={copy.accent}>
      <header className="workspace-editor__heading">
        <span>{copy.eyebrow}</span>
        <h1>{initialPost ? `编辑：${copy.title.replace("写", "")}` : copy.title}</h1>
      </header>

      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="标题"
        aria-label="文章标题"
        className="workspace-editor__title"
      />

      <div className="workspace-editor__metadata">
        {kind === "TECHNICAL" && (
          <label>
            <span>文章分类</span>
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setTechnicalColumnIds([]);
              }}
            >
              <option value="">选择知识分类或竞赛类别</option>
              <optgroup label="知识库">
                {categories
                  .filter((category) => category.type === "KNOWLEDGE")
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="竞赛">
                {categories
                  .filter((category) => category.type === "COMPETITION")
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </label>
        )}

        {kind !== "TECHNICAL" && (
          <label>
            <span>{kind === "NEWS" ? "新闻专栏" : "日常专栏"}</span>
            <select value={columnId} onChange={(event) => setColumnId(event.target.value)}>
              {kind === "NEWS" && <option value="">普通新闻，不加入专栏</option>}
              {kind === "DAILY" && <option value="">不加入专栏，仅收录到日常文章</option>}
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          <span>渲染风格</span>
          <select
            value={renderStyle}
            onChange={(event) =>
              setRenderStyle(event.target.value as "DEFAULT" | "TECHNICAL" | "PAPER")
            }
          >
            <option value="DEFAULT">默认阅读</option>
            <option value="TECHNICAL">技术文档</option>
            <option value="PAPER">论文阅读</option>
          </select>
        </label>

        <label>
          <span>标签</span>
          <input
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="用逗号分隔"
          />
        </label>
      </div>

      {kind === "TECHNICAL" && categoryId && (
        <fieldset className="workspace-editor__technical-columns">
          <legend>所属专栏（可多选）</legend>
          <div>
            {columns
              .filter((column) => column.type === "TECHNICAL" && column.categoryId === categoryId)
              .map((column) => (
                <label key={column.id}>
                  <input
                    type="checkbox"
                    checked={technicalColumnIds.includes(column.id)}
                    onChange={(event) =>
                      setTechnicalColumnIds((current) =>
                        event.target.checked
                          ? [...current, column.id]
                          : current.filter((id) => id !== column.id)
                      )
                    }
                  />
                  <span>{column.title}</span>
                  {!column.isActive && <small>已停用</small>}
                </label>
              ))}
            {columns.filter(
              (column) => column.type === "TECHNICAL" && column.categoryId === categoryId
            ).length === 0 && <p>当前分类还没有专栏，可在“分类与专栏”中创建。</p>}
          </div>
        </fieldset>
      )}

      <div className="workspace-editor__toolbar" aria-label="编辑工具">
        {toolButtons.map(({ label, icon: Icon, template }) => (
          <button key={label} type="button" title={label} onClick={() => insertTemplate(template)}>
            <Icon size={15} aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </button>
        ))}
      </div>

      <div className="workspace-editor__body">
        <div ref={editorRef} className="workspace-editor__surface" />
        <aside className="workspace-editor__outline">
          <OutlinePanel markdown={markdown} editorRef={editorRef} />
        </aside>
      </div>

      <section className="workspace-editor__attachments" aria-labelledby="editor-attachments-title">
        <div>
          <span id="editor-attachments-title">附件</span>
          <small>{attachments.length}/20</small>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => void uploadAttachments(event.target.files)}
        />
        <button
          type="button"
          className="workspace-icon-command"
          title="上传附件"
          disabled={uploading || attachments.length >= 20}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} aria-hidden="true" />
          <span>{uploading ? "上传中" : "上传附件"}</span>
        </button>
        <div className="workspace-editor__file-list">
          {attachments.map((file) => (
            <div key={file.id}>
              <FileText size={15} aria-hidden="true" />
              <span>{file.filename}</span>
              <small>{(file.size / 1024).toFixed(0)} KB</small>
              <button
                type="button"
                title="从文章移除"
                onClick={() =>
                  setAttachments((current) => current.filter((item) => item.id !== file.id))
                }
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
          {attachments.length === 0 && <p>尚未添加附件。</p>}
        </div>
      </section>

      <footer className="workspace-editor__actions">
        <button
          type="button"
          className="btn-primary"
          disabled={saving || uploading || !ready}
          onClick={() => void save()}
        >
          {saving ? "保存中" : postStatus === "PUBLISHED" ? "保存更新" : "保存草稿"}
        </button>
        {postStatus !== "PUBLISHED" && (
          <button
            type="button"
            className="btn-primary workspace-editor__publish"
            disabled={saving || uploading || !ready}
            onClick={() => void save("PUBLISHED")}
          >
            发布
          </button>
        )}
        {initialPost && (
          <button
            type="button"
            className="workspace-danger-command"
            disabled={saving}
            onClick={() => void removePost()}
          >
            <Trash2 size={15} aria-hidden="true" />
            <span>删除</span>
          </button>
        )}
        {message && <p role="status">{message}</p>}
      </footer>
    </div>
  );
}
