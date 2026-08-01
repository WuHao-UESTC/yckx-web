"use client";

import Giscus from "@giscus/react";

/**
 * giscus 评论区 — 基于 GitHub Discussions，零维护成本。
 *
 * 配置方式（在 .env.local 中设置）：
 *   NEXT_PUBLIC_GISCUS_REPO=WuHao-UESTC/yckx-web
 *   NEXT_PUBLIC_GISCUS_REPO_ID=R_kgXXXXXXXX
 *   NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
 *   NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwXXXXXXXX
 *
 * 前往 https://giscus.app/zh-CN 填入仓库信息即可获取以上 ID。
 * 未配置时评论区不渲染。
 */
export function GiscusComments() {
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

  if (!repo || !repoId || !category || !categoryId) return null;

  return (
    <div className="mt-10 pt-6 border-t border-[#e8e0d5]">
      <h3 className="text-lg font-bold text-[#1a1a1a] mb-4 font-[family-name:var(--font-sans)]">
        评论
      </h3>
      <Giscus
        repo={repo as `${string}/${string}`}
        repoId={repoId}
        category={category}
        categoryId={categoryId}
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="preferred_color_scheme"
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
