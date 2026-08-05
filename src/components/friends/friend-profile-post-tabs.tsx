"use client";

import { useMemo, useState } from "react";
import { PostCard, type PostCardData } from "@/components/article/post-card";

type PostKindFilter = "ALL" | "TECHNICAL" | "NEWS" | "DAILY";

const FILTERS: { value: PostKindFilter; label: string }[] = [
  { value: "ALL", label: "全部记录" },
  { value: "TECHNICAL", label: "知识与竞赛" },
  { value: "NEWS", label: "科协新闻" },
  { value: "DAILY", label: "日常记录" },
];

export function FriendProfilePostTabs({ posts }: { posts: PostCardData[] }) {
  const [filter, setFilter] = useState<PostKindFilter>("ALL");
  const visiblePosts = useMemo(
    () => (filter === "ALL" ? posts : posts.filter((post) => post.kind === filter)),
    [filter, posts]
  );

  return (
    <div className="friend-profile__posts">
      <div className="friend-profile__post-tabs" role="tablist" aria-label="按文章领域筛选">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            className={filter === item.value ? "is-active" : ""}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {visiblePosts.length > 0 ? (
        <div className="post-signal-list">
          {visiblePosts.map((post) => (
            <PostCard key={post.id} post={post} showExcerpt={false} showTags />
          ))}
        </div>
      ) : (
        <p className="friend-profile__posts-empty">这个领域还没有公开记录。</p>
      )}
    </div>
  );
}
