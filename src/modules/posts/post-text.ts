export function generateExcerpt(markdown: string, maxLength = 200): string {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[\[*>`_~]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}...` : plainText;
}
