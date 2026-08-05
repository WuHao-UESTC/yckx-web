export function createUrlSlug(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-|-$/g, "");

  return cleaned || `post-${Date.now().toString(36)}`;
}
