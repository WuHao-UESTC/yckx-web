"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function StickyNoteForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isLoggedIn) {
    return (
      <div className="mb-4 p-3 rounded-md bg-[#faf7f2] border border-[#e8e0d5] text-center text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
        <a href="/login" className="text-[#8b5e3c] hover:text-[#5a3a22]">登录</a>后可发布吐槽便签
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    if (content.length > 200) { setMsg("最多 200 字"); return; }
    setSending(true);
    setMsg("");

    const res = await fetch("/api/sticky-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), isAnonymous }),
    });

    if (res.ok) {
      setContent("");
      setIsAnonymous(false);
      setMsg("发布成功！");
      router.refresh();
    } else {
      const err = await res.json();
      setMsg(err.error || "发布失败");
    }
    setSending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-5 card flex gap-3 items-end flex-wrap">
      <div className="flex-1 min-w-[150px]">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="随便吐槽点什么…（1-200字）"
          rows={2}
          maxLength={200}
          className="input-field w-full resize-none text-sm font-[family-name:var(--font-sans)]"
        />
        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-1 text-xs text-[#6b6b6b] cursor-pointer font-[family-name:var(--font-sans)]">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-3 h-3" />
            匿名
          </label>
          <span className="text-[10px] text-[#6b6b6b] font-[family-name:var(--font-sans)]">{content.length}/200</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={sending || !content.trim()} className="btn-primary text-xs">
          {sending ? "发布中…" : "吐槽"}
        </button>
        {msg && <span className="text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)]">{msg}</span>}
      </div>
    </form>
  );
}
