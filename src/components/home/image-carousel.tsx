"use client";

import { useState, useEffect, useCallback } from "react";

interface Props {
  images: { src: string; alt: string; caption?: string }[];
  interval?: number; // ms
}

export function ImageCarousel({ images, interval = 4000 }: Props) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + images.length) % images.length);
  }, [images.length]);

  // 自动轮播
  useEffect(() => {
    if (isPaused || images.length <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [isPaused, next, interval, images.length]);

  if (images.length === 0) {
    return (
      <div className="w-full h-full min-h-[240px] bg-[#f5f0e8] rounded-lg flex items-center justify-center text-[#6b6b6b] text-sm font-[family-name:var(--font-sans)]">
        暂无图片
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full min-h-[240px] rounded-lg overflow-hidden bg-[#f5f0e8] group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 图片 */}
      <div className="relative w-full h-full">
        {images.map((img, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* 标题 */}
      {images[current].caption && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-3">
          <p className="text-white text-xs font-[family-name:var(--font-sans)]">{images[current].caption}</p>
        </div>
      )}

      {/* 左右箭头 */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/70 hover:bg-white text-[#6b6b6b] hover:text-[#1a1a1a] flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            ‹
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/70 hover:bg-white text-[#6b6b6b] hover:text-[#1a1a1a] flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            ›
          </button>
        </>
      )}

      {/* 圆点指示器 */}
      {images.length > 1 && (
        <div className="absolute bottom-2 right-2 flex gap-1">
          {images.map((_, i) => (
            <button
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40"}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
