"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Note {
  id: string;
  content: string;
  isAnonymous: boolean;
  color: string;
  createdAt: Date;
  author: { displayName: string | null; username: string };
}

const COLORS: Record<string, string> = {
  yellow: "bg-[#fef9e7]",
  pink: "bg-[#fdedec]",
  blue: "bg-[#ebf5fb]",
  green: "bg-[#eafaf1]",
  purple: "bg-[#f4ecf7]",
  orange: "bg-[#fef5e7]",
};

export function StickyNoteCard({ note, index, canDelete }: { note: Note; index: number; canDelete: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const rotation = ((index % 5) - 2) * 1.5;
  const colorClass = COLORS[note.color] || COLORS.yellow;

  async function handleDelete() {
    if (!confirm("确定删除这条便签？")) return;
    setDeleting(true);
    const res = await fetch(`/api/sticky-notes/${note.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setDeleting(false);
  }

  return (
    <div
      className={`${colorClass} break-inside-avoid mb-4 p-4 rounded-sm shadow-sm hover:shadow-md hover:scale-[1.02] hover:-rotate-0 transition-all duration-200 relative group`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <p className="text-sm text-[#2c2c2c] leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-sans)]">
        {note.content}
      </p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-[#6b6b6b] font-[family-name:var(--font-sans)]">
          {note.isAnonymous ? "匿名" : (note.author.displayName ?? note.author.username)}
          {" · "}
          {note.createdAt.toLocaleDateString("zh-CN")}
        </p>
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity font-[family-name:var(--font-sans)]"
          >
            {deleting ? "…" : "删除"}
          </button>
        )}
      </div>
    </div>
  );
}
