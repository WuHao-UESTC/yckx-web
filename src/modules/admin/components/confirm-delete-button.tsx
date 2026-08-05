"use client";

import { Trash2 } from "lucide-react";

export function ConfirmDeleteButton({ noun }: { noun: string }) {
  return (
    <button
      type="submit"
      className="admin-danger-command"
      title={`删除${noun}`}
      onClick={(event) => {
        if (!window.confirm(`确定永久删除这个${noun}吗？`)) event.preventDefault();
      }}
    >
      <Trash2 size={14} aria-hidden="true" />
      <span className="sr-only">删除{noun}</span>
    </button>
  );
}
