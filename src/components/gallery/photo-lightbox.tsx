"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Photo {
  id: string;
  imagePath: string;
  caption: string | null;
  createdAt: Date;
  author: { displayName: string | null; username: string };
}

function photoDate(photo: Photo) {
  return new Date(photo.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PhotoLightbox({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastTriggerIndex = useRef(0);

  const open = useCallback((index: number) => {
    lastTriggerIndex.current = index;
    setSelected(index);
  }, []);
  const close = useCallback(() => {
    setSelected(null);
    requestAnimationFrame(() => triggerRefs.current[lastTriggerIndex.current]?.focus());
  }, []);
  const prev = useCallback(() => {
    setSelected((current) =>
      current !== null ? (current - 1 + photos.length) % photos.length : null
    );
  }, [photos.length]);
  const next = useCallback(() => {
    setSelected((current) => (current !== null ? (current + 1) % photos.length : null));
  }, [photos.length]);

  useEffect(() => {
    if (selected === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handler);
    };
  }, [selected, close, next, prev]);

  if (photos.length === 0) return null;
  const selectedPhoto = selected !== null ? photos[selected] : null;

  return (
    <>
      <div className="routine-photo-wall" aria-label="照片墙">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            ref={(element) => {
              triggerRefs.current[index] = element;
            }}
            type="button"
            className="routine-photo-wall__photo"
            onClick={() => open(index)}
            aria-label={`查看照片：${photo.caption || "该照片暂时没有描述"}`}
          >
            <span className="routine-photo-wall__pin" aria-hidden="true" />
            <span className="routine-photo-wall__frame">
              <img src={photo.imagePath} alt={photo.caption ?? "日常照片"} loading="lazy" />
            </span>
            <span className="routine-photo-wall__caption">
              <strong>{photo.caption || "该照片暂时没有描述"}</strong>
              <small>{photoDate(photo)}</small>
            </span>
          </button>
        ))}
      </div>

      {selectedPhoto && typeof document !== "undefined"
        ? createPortal(
            <div className="routine-photo-dialog-backdrop" onMouseDown={close}>
              <div
                className="routine-photo-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="routine-photo-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="routine-photo-dialog__close"
                  onClick={close}
                  aria-label="关闭照片"
                  title="关闭"
                >
                  <X size={20} aria-hidden="true" />
                </button>

                <div className="routine-photo-dialog__image">
                  <img src={selectedPhoto.imagePath} alt={selectedPhoto.caption ?? "日常照片"} />
                </div>

                <article className="routine-photo-dialog__letter">
                  <header>
                    <span>同行影像</span>
                    <time dateTime={new Date(selectedPhoto.createdAt).toISOString()}>
                      {photoDate(selectedPhoto)}
                    </time>
                  </header>
                  <h2 id="routine-photo-dialog-title">
                    {selectedPhoto.author.displayName ?? selectedPhoto.author.username} 的照片记录
                  </h2>
                  <p>{selectedPhoto.caption || "该照片暂时没有描述"}</p>
                  <footer>
                    PHOTO {(selected ?? 0) + 1} / {photos.length}
                  </footer>
                </article>

                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="routine-photo-dialog__previous"
                      onClick={prev}
                      aria-label="上一张照片"
                      title="上一张"
                    >
                      <ChevronLeft size={22} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="routine-photo-dialog__next"
                      onClick={next}
                      aria-label="下一张照片"
                      title="下一张"
                    >
                      <ChevronRight size={22} aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
