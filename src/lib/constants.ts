/** 站点名称 */
export const SITE_NAME = "英才科协";

/** 站点描述 */
export const SITE_DESCRIPTION = "英才科协 — 技术博客、竞赛知识库、工作日志与团队日常";

/** 每页文章数 */
export const POSTS_PER_PAGE = 10;

/** 文件上传限制 */
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_USER_STORAGE = 200 * 1024 * 1024; // 200MB

/** 允许的文件类型 */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-rar-compressed",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

/** 导航链接 */
export const NAV_LINKS = [
  { label: "技术支持", href: "/knowledge-base" },
  { label: "竞赛", href: "/competition" },
  { label: "大事记", href: "/events" },
  { label: "科协日常", href: "/routine" },
  { label: "友链", href: "/friends" },
] as const;
