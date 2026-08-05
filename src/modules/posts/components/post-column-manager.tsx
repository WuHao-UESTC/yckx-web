"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Columns3, Save } from "lucide-react";

type ColumnOption = {
  id: string;
  title: string;
  categoryId: string | null;
  isActive: boolean;
};

export function PostColumnManager({
  kind,
  slug,
  categoryId,
  selectedIds,
  columns,
}: {
  kind: "TECHNICAL" | "NEWS" | "DAILY";
  slug: string;
  categoryId: string | null;
  selectedIds: string[];
  columns: ColumnOption[];
}) {
  const router = useRouter();
  const [selection, setSelection] = useState(selectedIds);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const options = columns.filter(
    (column) =>
      (kind !== "TECHNICAL" || column.categoryId === categoryId) &&
      (column.isActive || selectedIds.includes(column.id))
  );

  async function save() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "TECHNICAL"
            ? { technicalColumnIds: selection }
            : kind === "NEWS"
              ? { newsColumnIds: selection }
              : { dailyColumnIds: selection }
        ),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "专栏更新失败");
      setMessage("已更新");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "专栏更新失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="post-column-manager">
      <summary title="管理所属专栏">
        <Columns3 size={14} aria-hidden="true" />
        <span>{selection.length > 0 ? `${selection.length} 个专栏` : "管理专栏"}</span>
      </summary>
      <div className="post-column-manager__panel">
        {options.length > 0 ? (
          options.map((column) => (
            <label key={column.id}>
              <input
                type="checkbox"
                checked={selection.includes(column.id)}
                onChange={(event) =>
                  setSelection((current) =>
                    event.target.checked
                      ? [...current, column.id]
                      : current.filter((id) => id !== column.id)
                  )
                }
              />
              <span>{column.title}</span>
              {!column.isActive && <small>已停用</small>}
            </label>
          ))
        ) : (
          <p>
            {kind === "TECHNICAL"
              ? "当前分类没有可用专栏。"
              : kind === "NEWS"
                ? "暂无可用新闻专栏。"
                : "暂无可用日常专栏。"}
          </p>
        )}
        <button type="button" disabled={pending} onClick={() => void save()}>
          <Save size={13} aria-hidden="true" />
          <span>{pending ? "保存中" : "保存"}</span>
        </button>
        {message && <small role="status">{message}</small>}
      </div>
    </details>
  );
}
