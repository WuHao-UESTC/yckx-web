/** 站点名称 */
export const SITE_NAME = "英才科协";

/** 站点描述 */
export const SITE_DESCRIPTION = "英才科协 — 技术博客、竞赛知识库、工作日志与团队日常";

/** 每页文章数 */
export const POSTS_PER_PAGE = 10;

/** 文件上传限制：内部成员总空间 5GB，单文件不超过 1GB。 */
export const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GB
export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_USER_STORAGE = 5 * 1024 * 1024 * 1024; // 5GB

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
  { label: "新闻与大事记", href: "/archive" },
  { label: "科协日常", href: "/routine" },
  { label: "友链", href: "/friends" },
] as const;
