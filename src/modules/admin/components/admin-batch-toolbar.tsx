"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

type BatchAction = (formData: FormData) => void | Promise<void>;
const MAX_BATCH_SELECTION = 100;

function groupCheckboxes(group: string): HTMLInputElement[] {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>(`input[data-admin-batch-group="${group}"]`)
  ).filter((checkbox) => !checkbox.disabled);
}

export function AdminBatchToolbar({
  action,
  formId,
  group,
  itemCount,
  noun,
}: {
  action: BatchAction;
  formId: string;
  group: string;
  itemCount: number;
  noun: string;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const updateCount = (event?: Event) => {
      const checked = groupCheckboxes(group).filter((checkbox) => checkbox.checked);
      if (checked.length > MAX_BATCH_SELECTION) {
        const target = event?.target;
        if (target instanceof HTMLInputElement) target.checked = false;
        setSelectedCount(MAX_BATCH_SELECTION);
        return;
      }
      setSelectedCount(checked.length);
    };
    document.addEventListener("change", updateCount);
    updateCount();
    return () => document.removeEventListener("change", updateCount);
  }, [group]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = selectedCount > 0 && selectedCount < itemCount;
  }, [itemCount, selectedCount]);

  if (itemCount === 0) return null;

  return (
    <form
      id={formId}
      action={action}
      className="admin-batch-toolbar"
      onSubmit={(event) => {
        if (
          selectedCount === 0 ||
          !window.confirm(`确定永久删除选中的 ${selectedCount} 个${noun}吗？`)
        ) {
          event.preventDefault();
        }
      }}
    >
      <label>
        <input
          ref={selectAllRef}
          type="checkbox"
          checked={selectedCount === itemCount}
          onChange={(event) => {
            const checkboxes = groupCheckboxes(group);
            checkboxes.forEach((checkbox, index) => {
              checkbox.checked = event.target.checked && index < MAX_BATCH_SELECTION;
            });
            setSelectedCount(event.target.checked ? Math.min(itemCount, MAX_BATCH_SELECTION) : 0);
          }}
        />
        <span>{itemCount > MAX_BATCH_SELECTION ? "选择前 100 项" : "全选本页"}</span>
      </label>
      <span>
        {selectedCount > 0
          ? `已选择 ${selectedCount} 项`
          : itemCount > MAX_BATCH_SELECTION
            ? `共 ${itemCount} 项，单次最多 100 项`
            : `共 ${itemCount} 项`}
      </span>
      <button type="submit" disabled={selectedCount === 0} title={`批量删除${noun}`}>
        <Trash2 size={15} aria-hidden="true" />
        <span>批量删除</span>
      </button>
    </form>
  );
}

export function AdminBatchCheckbox({
  formId,
  group,
  id,
  disabled = false,
  label,
}: {
  formId: string;
  group: string;
  id: string;
  disabled?: boolean;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      name="ids"
      value={id}
      form={formId}
      data-admin-batch-group={group}
      disabled={disabled}
      aria-label={label}
      className="admin-row-selector"
    />
  );
}
