"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

type CommentItem = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  author: { username: string; displayName: string | null; avatar: string | null };
};

export function NativeComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/comments?postId=${encodeURIComponent(postId)}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: CommentItem[]) => {
        if (active) setComments(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [postId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "发表评论失败，请先登录");
      return;
    }
    setContent("");
    setComments((current) => [...current, data]);
  }

  return (
    <section
      className="mt-10 pt-6 border-t border-[#e8e0d5]"
      aria-labelledby="native-comments-title"
    >
      <h3
        id="native-comments-title"
        className="text-lg font-bold text-[#1a1a1a] mb-4 flex items-center gap-2"
      >
        <MessageSquare size={18} aria-hidden="true" />
        评论
      </h3>
      <div className="space-y-3 mb-5">
        {comments.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">还没有评论，欢迎留下第一条。</p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="border-b border-[#eee6db] pb-3">
              <div className="flex items-center justify-between text-xs text-[#6b6b6b]">
                <strong className="text-[#1a1a1a]">
                  {comment.author.displayName ?? comment.author.username}
                </strong>
                <span>{new Date(comment.createdAt).toLocaleString("zh-CN")}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#343434]">{comment.content}</p>
            </article>
          ))
        )}
      </div>
      <form onSubmit={submit} className="space-y-2">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="input-field w-full min-h-24"
          placeholder="登录后发表评论"
          maxLength={5000}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary text-sm">
          <Send size={14} aria-hidden="true" />
          {loading ? "发布中..." : "发表评论"}
        </button>
      </form>
    </section>
  );
}
