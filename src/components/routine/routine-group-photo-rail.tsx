"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

type GroupPhoto = {
  id: string;
  imagePath: string;
  caption: string | null;
  year: number | null;
  createdAt: Date;
};

export function RoutineGroupPhotoRail({ photos }: { photos: GroupPhoto[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth, behavior: "smooth" });
  }

  return (
    <section className="routine-group-photos" aria-label="科协合照">
      <div className="routine-group-photos__label">
        <Images size={15} aria-hidden="true" />
        <span>合照档案</span>
        <small>
          {photos.length} FRAME{photos.length === 1 ? "" : "S"}
        </small>
      </div>

      {photos.length > 0 ? (
        <>
          <div ref={railRef} className="routine-group-photos__rail">
            {photos.map((photo) => (
              <figure key={photo.id} className="routine-group-photos__frame">
                <img
                  className="routine-group-photos__backdrop"
                  src={photo.imagePath}
                  alt=""
                  aria-hidden="true"
                />
                <div className="routine-group-photos__shade" aria-hidden="true" />
                <div className="routine-group-photos__surface">
                  <img
                    src={photo.imagePath}
                    alt={photo.caption ?? `${photo.year ?? "科协"} 年合照`}
                  />
                </div>
                <figcaption>
                  <strong>{photo.year ?? new Date(photo.createdAt).getFullYear()}</strong>
                  {photo.caption && <span>{photo.caption}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
          {photos.length > 1 && (
            <div className="routine-group-photos__controls">
              <button type="button" onClick={() => move(-1)} title="上一张合照">
                <ChevronLeft size={18} aria-hidden="true" />
                <span className="sr-only">上一张合照</span>
              </button>
              <button type="button" onClick={() => move(1)} title="下一张合照">
                <ChevronRight size={18} aria-hidden="true" />
                <span className="sr-only">下一张合照</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="routine-group-photos__empty">
          <Images size={24} strokeWidth={1.3} aria-hidden="true" />
          <span>合照待归档</span>
        </div>
      )}
    </section>
  );
}
