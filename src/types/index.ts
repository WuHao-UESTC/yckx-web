import type { Post, User, Category, Tag, Column, Comment } from "../generated/prisma/client";

/** 文章列表项（含关联） */
export type PostWithAuthor = Post & {
  author: Pick<User, "id" | "username" | "displayName" | "avatar">;
  category: Category | null;
  tags: { tag: Tag }[];
};

/** 文章详情（含关联） */
export type PostDetail = Post & {
  author: Pick<User, "id" | "username" | "displayName" | "avatar">;
  category: Category | null;
  column: Column | null;
  tags: { tag: Tag }[];
  files: File[];
};

/** 用户公开信息 */
export type PublicUser = Pick<User, "id" | "username" | "displayName" | "avatar" | "bio" | "role" | "createdAt"> & {
  profile: {
    website: string | null;
    github: string | null;
    bilibili: string | null;
    title: string | null;
  } | null;
  _count: { posts: number };
};

/** 分页结果 */
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
