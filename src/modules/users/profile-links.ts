export function safeWebsiteHref(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;
  if (candidate.startsWith("/")) return candidate;

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
