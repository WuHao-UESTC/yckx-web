"use client";

import { useEffect } from "react";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/posts/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      signal: controller.signal,
      keepalive: true,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [slug]);

  return null;
}
