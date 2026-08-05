"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Layers3, Pencil, Save } from "lucide-react";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  type: "KNOWLEDGE" | "COMPETITION";
  isActive: boolean;
  postCount: number;
  createdById: string | null;
};

type ColumnItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: "NEWS" | "DAILY" | "TECHNICAL";
  categoryId: string | null;
  isActive: boolean;
  postCount: number;
  createdById: string | null;
};

const GROUPS = [
  { type: "KNOWLEDGE", label: "知识分类", endpoint: "/api/categories", field: "name" },
  { type: "COMPETITION", label: "竞赛类别", endpoint: "/api/categories", field: "name" },
  { type: "NEWS", label: "新闻专栏", endpoint: "/api/columns", field: "title" },
  { type: "DAILY", label: "日常专栏", endpoint: "/api/columns", field: "title" },
] as const;

export function TaxonomyManager({
  categories,
  columns,
  currentUser,
}: {
  categories: CategoryItem[];
  columns: ColumnItem[];
  currentUser: { id: string; role: "ADMIN" | "MEMBER" };
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [technicalCategoryId, setTechnicalCategoryId] = useState(
    categories.find((category) => category.isActive)?.id ?? ""
  );
  const [technicalTitle, setTechnicalTitle] = useState("");
  const [technicalDescription, setTechnicalDescription] = useState("");
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function createGroup(group: (typeof GROUPS)[number]) {
    const value = values[group.type]?.trim();
    if (!value) return;
    setPendingType(group.type);
    setMessage("");
    try {
      const body = {
        [group.field]: value,
        type: group.type,
        ...(group.endpoint === "/api/columns"
          ? { description: descriptions[group.type]?.trim() ?? "" }
          : {}),
      };
      const response = await fetch(group.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "创建失败");
      setValues((current) => ({ ...current, [group.type]: "" }));
      setDescriptions((current) => ({ ...current, [group.type]: "" }));
      setMessage(`${group.label}已可用于写作`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建失败");
    } finally {
      setPendingType(null);
    }
  }

  async function createTechnicalColumn() {
    if (!technicalCategoryId || !technicalTitle.trim()) return;
    setPendingType("TECHNICAL");
    setMessage("");
    try {
      const response = await fetch("/api/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TECHNICAL",
          categoryId: technicalCategoryId,
          title: technicalTitle.trim(),
          description: technicalDescription.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "创建失败");
      setTechnicalTitle("");
      setTechnicalDescription("");
      setMessage("技术专栏已可用于写作");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建失败");
    } finally {
      setPendingType(null);
    }
  }

  const canRename = (createdById: string | null) =>
    currentUser.role === "ADMIN" || createdById === currentUser.id;

  return (
    <div className="taxonomy-manager">
      <header className="workspace-panel-heading">
        <span>SHARED INDEX</span>
        <h1>分类与专栏</h1>
        <p>成员可以创建全站共享的内容组织项，并重命名自己创建的项目。</p>
      </header>

      <div className="taxonomy-manager__groups">
        {GROUPS.map((group) => {
          const items =
            group.type === "KNOWLEDGE" || group.type === "COMPETITION"
              ? categories.filter((item) => item.type === group.type)
              : columns.filter((item) => item.type === group.type);

          return (
            <section key={group.type} data-taxonomy-type={group.type.toLowerCase()}>
              <header>
                {group.endpoint === "/api/categories" ? (
                  <FolderPlus size={18} aria-hidden="true" />
                ) : (
                  <Layers3 size={18} aria-hidden="true" />
                )}
                <div>
                  <small>{group.type}</small>
                  <h2>{group.label}</h2>
                </div>
                <span>{items.length} 项</span>
              </header>

              <div className="taxonomy-manager__form">
                <input
                  value={values[group.type] ?? ""}
                  maxLength={group.endpoint === "/api/categories" ? 80 : 100}
                  placeholder={`新建${group.label}`}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [group.type]: event.target.value }))
                  }
                />
                {group.endpoint === "/api/columns" && (
                  <input
                    value={descriptions[group.type] ?? ""}
                    maxLength={300}
                    placeholder="专栏说明，可选"
                    onChange={(event) =>
                      setDescriptions((current) => ({
                        ...current,
                        [group.type]: event.target.value,
                      }))
                    }
                  />
                )}
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!values[group.type]?.trim() || pendingType !== null}
                  onClick={() => void createGroup(group)}
                >
                  {pendingType === group.type ? "创建中" : "创建"}
                </button>
              </div>

              <div className="taxonomy-manager__list">
                {items.map((item) => (
                  <TaxonomyRow
                    key={item.id}
                    label={"name" in item ? item.name : item.title}
                    slug={item.slug}
                    endpoint={"name" in item ? "/api/categories" : "/api/columns"}
                    field={"name" in item ? "name" : "title"}
                    postCount={item.postCount}
                    isActive={item.isActive}
                    canRename={canRename(item.createdById)}
                    onSaved={() => router.refresh()}
                  />
                ))}
                {items.length === 0 && <p>尚未创建。</p>}
              </div>
            </section>
          );
        })}

        <section data-taxonomy-type="technical">
          <header>
            <Layers3 size={18} aria-hidden="true" />
            <div>
              <small>TECHNICAL</small>
              <h2>分类下技术专栏</h2>
            </div>
            <span>{columns.filter((column) => column.type === "TECHNICAL").length} 项</span>
          </header>
          <div className="taxonomy-manager__form taxonomy-manager__form--technical">
            <select
              value={technicalCategoryId}
              onChange={(event) => setTechnicalCategoryId(event.target.value)}
            >
              {categories
                .filter((category) => category.isActive)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.type === "KNOWLEDGE" ? "知识" : "竞赛"} · {category.name}
                  </option>
                ))}
            </select>
            <input
              value={technicalTitle}
              maxLength={100}
              placeholder="专栏标题"
              onChange={(event) => setTechnicalTitle(event.target.value)}
            />
            <input
              value={technicalDescription}
              maxLength={300}
              placeholder="专栏说明，可选"
              onChange={(event) => setTechnicalDescription(event.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={!technicalCategoryId || !technicalTitle.trim() || pendingType !== null}
              onClick={() => void createTechnicalColumn()}
            >
              {pendingType === "TECHNICAL" ? "创建中" : "创建"}
            </button>
          </div>
          <div className="taxonomy-manager__list">
            {columns
              .filter((column) => column.type === "TECHNICAL")
              .map((column) => {
                const category = categories.find((item) => item.id === column.categoryId);
                return (
                  <TaxonomyRow
                    key={column.id}
                    label={column.title}
                    context={category?.name ?? "所属分类已删除"}
                    slug={column.slug}
                    endpoint="/api/columns"
                    field="title"
                    postCount={column.postCount}
                    isActive={column.isActive}
                    canRename={canRename(column.createdById)}
                    onSaved={() => router.refresh()}
                  />
                );
              })}
          </div>
        </section>
      </div>

      {message && (
        <p className="taxonomy-manager__status" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function TaxonomyRow({
  label,
  context,
  slug,
  endpoint,
  field,
  postCount,
  isActive,
  canRename,
  onSaved,
}: {
  label: string;
  context?: string;
  slug: string;
  endpoint: "/api/categories" | "/api/columns";
  field: "name" | "title";
  postCount: number;
  isActive: boolean;
  canRename: boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function saveRename() {
    const nextValue = value.trim();
    if (!nextValue || nextValue === label) {
      setEditing(false);
      setValue(label);
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch(`${endpoint}/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "重命名失败");
      setEditing(false);
      onSaved();
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "重命名失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="taxonomy-manager__row">
      <span>
        {editing ? (
          <input value={value} maxLength={100} onChange={(event) => setValue(event.target.value)} />
        ) : (
          label
        )}
        {context && <small>{context}</small>}
        {error && <small className="taxonomy-manager__row-error">{error}</small>}
      </span>
      <small>{postCount} 篇</small>
      {!isActive && <em>已停用</em>}
      {canRename && (
        <button
          type="button"
          className="workspace-icon-command"
          title={editing ? "保存名称" : "重命名"}
          disabled={pending}
          onClick={() => {
            if (editing) {
              void saveRename();
              return;
            }
            setValue(label);
            setEditing(true);
          }}
        >
          {editing ? (
            <Save size={14} aria-hidden="true" />
          ) : (
            <Pencil size={14} aria-hidden="true" />
          )}
          <span className="sr-only">{editing ? "保存名称" : "重命名"}</span>
        </button>
      )}
    </div>
  );
}
