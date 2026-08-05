"use client";

import { useState, useCallback, useEffect } from "react";

interface Photo {
  id: string;
  imagePath: string;
  caption: string | null;
  author: { displayName: string | null; username: string };
}

export function PhotoLightbox({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState<number | null>(null);

  const open = useCallback((index: number) => setSelected(index), []);
  const close = useCallback(() => setSelected(null), []);
  const prev = useCallback(() => {
    setSelected((s) => (s !== null ? (s - 1 + photos.length) % photos.length : null));
  }, [photos.length]);
  const next = useCallback(() => {
    setSelected((s) => (s !== null ? (s + 1) % photos.length : null));
  }, [photos.length]);

  // 键盘导航
  useEffect(() => {
    if (selected === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selected, close, prev, next]);

  if (photos.length === 0) return null;

  return (
    <>
      {/* Masonry 照片墙 */}
      <div className="routine-gallery columns-2 gap-3 space-y-3 sm:columns-3 lg:columns-4">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="routine-gallery__item group relative break-inside-avoid cursor-zoom-in overflow-hidden bg-[#f5f0e8]"
            onClick={() => open(i)}
          >
            <img
              src={photo.imagePath}
              alt={photo.caption ?? ""}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {photo.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-[family-name:var(--font-sans)]">
                  {photo.caption}
                </p>
                <p className="text-white/70 text-[10px] mt-0.5">
                  {photo.author.displayName ?? photo.author.username}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox 遮罩 */}
      {selected !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          {/* 关闭按钮 */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            onClick={close}
            aria-label="关闭"
          >
            ×
          </button>

          {/* 上一张 */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-2xl z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="上一张"
          >
            ‹
          </button>

          {/* 下一张 */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-2xl z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="下一张"
          >
            ›
          </button>

          {/* 图片 */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[selected].imagePath}
              alt={photos[selected].caption ?? ""}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {photos[selected].caption && (
              <p className="text-white/80 text-sm mt-3 text-center font-[family-name:var(--font-sans)]">
                {photos[selected].caption}
              </p>
            )}
            <p className="text-white/50 text-xs mt-1 font-[family-name:var(--font-sans)]">
              {selected + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
