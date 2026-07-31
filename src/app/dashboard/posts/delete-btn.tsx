"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("确定要永久删除这篇文章吗？")) return;
    setLoading(true);
    await fetch(`/api/posts/${slug}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 font-[family-name:var(--font-sans)]"
    >
      {loading ? "…" : "删除"}
    </button>
  );
}
