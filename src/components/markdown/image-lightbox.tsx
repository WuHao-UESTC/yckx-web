"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * 文章内嵌图片 Lightbox 包装器。
 * 点击图片 → 全屏遮罩放大 / 键盘 ESC 关闭。
 */
export function ImageLightbox({ src, alt }: { src?: string | Blob; alt?: string }) {
  const srcStr = typeof src === "string" ? src : undefined;
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  return (
    <>
      <img
        src={srcStr}
        alt={alt}
        className="rounded-md cursor-zoom-in hover:opacity-90 transition-opacity"
        loading="lazy"
        onClick={() => setOpen(true)}
      />

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-8"
          onClick={close}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors z-10"
            onClick={close}
            aria-label="关闭"
          >
            ×
          </button>
          <img
            src={srcStr}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
