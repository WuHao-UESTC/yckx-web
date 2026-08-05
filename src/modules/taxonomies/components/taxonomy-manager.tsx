"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Layers3 } from "lucide-react";

type CategoryItem = {
  id: string;
  name: string;
  type: "KNOWLEDGE" | "COMPETITION";
  isActive: boolean;
  postCount: number;
};

type ColumnItem = {
  id: string;
  title: string;
  description: string | null;
  type: "NEWS" | "DAILY";
  isActive: boolean;
  postCount: number;
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
}: {
  categories: CategoryItem[];
  columns: ColumnItem[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
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

  return (
    <div className="taxonomy-manager">
      <header className="workspace-panel-heading">
        <span>SHARED INDEX</span>
        <h1>分类与专栏</h1>
        <p>成员可以创建全站共享的内容组织项；停用、改名和重复治理由管理员处理。</p>
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
                  <div key={item.id}>
                    <span>{"name" in item ? item.name : item.title}</span>
                    <small>{item.postCount} 篇</small>
                    {!item.isActive && <em>已停用</em>}
                  </div>
                ))}
                {items.length === 0 && <p>尚未创建。</p>}
              </div>
            </section>
          );
        })}
      </div>

      {message && (
        <p className="taxonomy-manager__status" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
