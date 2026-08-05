type RoutableCategory = {
  slug?: string | null;
  type?: string | null;
};

export type RoutablePost = {
  slug: string;
  category?: RoutableCategory | null;
};

/** 根据文章所属板块生成稳定的公共详情地址。 */
export function postUrl(post: RoutablePost): string {
  const type = post.category?.type;
  const categorySlug = post.category?.slug ?? "uncategorized";

  if (type === "COMPETITION") return `/competition/${categorySlug}/${post.slug}`;
  if (type === "NEWS") return `/archive/news/${post.slug}`;
  if (type === "EVENT") return `/archive/events/${post.slug}`;
  return `/knowledge-base/${categorySlug}/${post.slug}`;
}
