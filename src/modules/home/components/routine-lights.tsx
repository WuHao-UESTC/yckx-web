"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, Camera, ChevronLeft, ChevronRight, RefreshCw, X } from "lucide-react";
import type { HomeMember, HomeNote, HomePhoto } from "../home.types";

const NOTE_BATCH_SIZE = 5;

const WHALE_SLOT_ROWS = [
  { row: 1, ranges: [[7, 7]] },
  { row: 2, ranges: [[5, 10]] },
  { row: 3, ranges: [[5, 11]] },
  { row: 4, ranges: [[5, 12]] },
  { row: 5, ranges: [[6, 19]] },
  { row: 6, ranges: [[6, 21]] },
  { row: 7, ranges: [[7, 18]] },
  { row: 8, ranges: [[6, 15]] },
  { row: 9, ranges: [[6, 16]] },
  {
    row: 10,
    ranges: [
      [5, 8],
      [12, 17],
    ],
  },
  {
    row: 11,
    ranges: [
      [4, 7],
      [16, 22],
    ],
  },
  {
    row: 12,
    ranges: [
      [4, 4],
      [18, 21],
    ],
  },
  { row: 13, ranges: [[18, 19]] },
  { row: 14, ranges: [[19, 20]] },
  { row: 15, ranges: [[20, 20]] },
] as const;

const WHALE_PHOTO_SLOTS = WHALE_SLOT_ROWS.flatMap(({ row, ranges }) =>
  ranges.flatMap(([start, end]) =>
    Array.from({ length: end - start + 1 }, (_, offset) => ({
      column: start + offset,
      row,
    }))
  )
);

const PHOTO_BATCH_SIZE = WHALE_PHOTO_SLOTS.length;

type FishStyle = CSSProperties & {
  "--fish-delay": string;
  "--fish-duration": string;
  "--fish-lane": string;
  "--fish-mobile-lane": string;
  "--fish-scale": string;
};

type WhalePhotoStyle = CSSProperties & {
  "--whale-column": string;
  "--whale-row": string;
};

function pageCount(items: unknown[], size: number) {
  return Math.max(1, Math.ceil(items.length / size));
}

function pageItems<T>(items: T[], page: number, size: number): T[] {
  return items.slice(page * size, page * size + size);
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function paperTone(note: HomeNote | undefined, index: number) {
  const knownTones: Record<string, string> = {
    yellow: "straw",
    orange: "apricot",
    pink: "rose",
    green: "sage",
    blue: "mist",
    purple: "rose",
  };
  return note ? (knownTones[note.color] ?? "straw") : ["straw", "apricot", "sage"][index % 3];
}

function MemberFishGraphic() {
  return (
    <svg className="routine-member-fish__graphic" viewBox="0 0 132 70" aria-hidden="true">
      <path
        className="routine-member-fish__body"
        d="M29 35C45 13 82 8 112 31C88 58 51 60 29 39C24 37 24 36 29 35Z"
      />
      <path className="routine-member-fish__tail" d="M30 35C16 18 6 17 5 32C3 48 15 53 31 39" />
      <path className="routine-member-fish__fin" d="M68 47C59 61 68 66 85 50" />
      <path className="routine-member-fish__fin" d="M72 23C65 12 76 8 91 20" />
      <path className="routine-member-fish__line" d="M47 29C63 21 86 21 103 31" />
      <circle className="routine-member-fish__eye" cx="104" cy="29" r="1.8" />
    </svg>
  );
}

export function RoutineLights({
  photos,
  notes,
  members,
}: {
  photos: HomePhoto[];
  notes: HomeNote[];
  members: HomeMember[];
}) {
  const [photoPage, setPhotoPage] = useState(0);
  const [notePage, setNotePage] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const photoPages = pageCount(photos, PHOTO_BATCH_SIZE);
  const notePages = pageCount(notes, NOTE_BATCH_SIZE);
  const visiblePhotos = useMemo(
    () => pageItems(photos, photoPage, PHOTO_BATCH_SIZE),
    [photoPage, photos]
  );
  const visibleNotes = useMemo(
    () => pageItems(notes, notePage, NOTE_BATCH_SIZE),
    [notePage, notes]
  );
  const activeMember = members.find((member) => member.id === activeMemberId) ?? null;
  const selectedPhoto =
    selectedPhotoIndex === null ? null : (visiblePhotos[selectedPhotoIndex] ?? null);

  const closeLightbox = useCallback(() => setSelectedPhotoIndex(null), []);
  const showPreviousPhoto = useCallback(() => {
    setSelectedPhotoIndex((current) => {
      if (current === null || visiblePhotos.length === 0) return null;
      return (current - 1 + visiblePhotos.length) % visiblePhotos.length;
    });
  }, [visiblePhotos.length]);
  const showNextPhoto = useCallback(() => {
    setSelectedPhotoIndex((current) => {
      if (current === null || visiblePhotos.length === 0) return null;
      return (current + 1) % visiblePhotos.length;
    });
  }, [visiblePhotos.length]);

  useEffect(() => {
    if (!selectedPhoto) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPreviousPhoto();
      if (event.key === "ArrowRight") showNextPhoto();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeLightbox, selectedPhoto, showNextPhoto, showPreviousPhoto]);

  const nextPhotoPage = () => {
    setSelectedPhotoIndex(null);
    setPhotoPage((current) => (current + 1) % photoPages);
  };

  const nextNotePage = () => {
    setNotePage((current) => (current + 1) % notePages);
  };

  return (
    <div className="routine-lights">
      <div className="routine-lights__top">
        <header className="routine-lights__heading">
          <div className="chapter-label">
            <span>1800m</span>
            <i aria-hidden="true" />
            <strong>同行灯火</strong>
          </div>
          <Camera className="chapter-icon" size={30} strokeWidth={1.35} aria-hidden="true" />
          <h2 id="routine-title">越向深处，同行的灯光越显得珍贵。</h2>
          <p>实验室里的夜晚、比赛途中的照片和随手留下的话，拼成技术之外真实的科协。</p>
        </header>

        <div className="routine-whale-stage">
          <div className="routine-whale" role="group" aria-label="由科协日常照片拼成的跃起座头鲸">
            {WHALE_PHOTO_SLOTS.map((slot, index) => {
              const photo = visiblePhotos[index];
              const photoStyle: WhalePhotoStyle = {
                "--whale-column": String(slot.column),
                "--whale-row": String(slot.row),
              };
              return photo ? (
                <button
                  key={photo.id}
                  type="button"
                  className="routine-whale-photo"
                  style={photoStyle}
                  onClick={() => setSelectedPhotoIndex(index)}
                  aria-label={`查看照片：${photo.caption ?? `科协日常照片 ${index + 1}`}`}
                >
                  <img src={photo.imagePath} alt={photo.caption ?? "科协日常照片"} loading="lazy" />
                  {photo.caption && <span>{photo.caption}</span>}
                </button>
              ) : (
                <span
                  key={`empty-photo-${slot.row}-${slot.column}`}
                  className="routine-whale-photo routine-whale-photo--empty"
                  style={photoStyle}
                  aria-hidden="true"
                />
              );
            })}
          </div>
          <div className="routine-whale-stage__controls">
            <span>
              {Math.min(photoPage * PHOTO_BATCH_SIZE + visiblePhotos.length, photos.length)} /{" "}
              {photos.length}
            </span>
            <button
              type="button"
              onClick={nextPhotoPage}
              disabled={photos.length <= PHOTO_BATCH_SIZE}
              aria-label="更换一批照片"
              title="换一批照片"
            >
              <RefreshCw size={15} aria-hidden="true" />
              换一批
            </button>
          </div>
        </div>
      </div>

      <section className="routine-note-stage" aria-labelledby="routine-notes-title">
        <div className="routine-note-stage__header">
          <h3 id="routine-notes-title">舱内留言</h3>
          <div>
            <Link href="/routine">
              进入科协日常
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={nextNotePage}
              disabled={notes.length <= NOTE_BATCH_SIZE}
              aria-label="更换一批留言"
              title="换一批留言"
            >
              <RefreshCw size={14} aria-hidden="true" />
              换一批
            </button>
          </div>
        </div>

        <div className="routine-note-stage__papers">
          {Array.from({ length: NOTE_BATCH_SIZE }, (_, index) => {
            const note = visibleNotes[index];
            return (
              <article
                key={note?.id ?? `empty-note-${index}`}
                className={`routine-paper-note routine-paper-note--${index + 1}`}
                data-paper={paperTone(note, index)}
                data-empty={!note}
                aria-hidden={!note}
              >
                {note ? (
                  <>
                    <p>{note.content}</p>
                    <cite>{note.authorName}</cite>
                  </>
                ) : index === 0 ? (
                  <span>等待下一条舱内留言</span>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="routine-member-stream" aria-labelledby="routine-members-title">
        <div className="routine-member-stream__label">
          <h3 id="routine-members-title">同行者</h3>
          <Link href="/friends">
            全部成员
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <div
          className="routine-member-readout"
          data-active={Boolean(activeMember)}
          aria-live="polite"
        >
          {activeMember ? (
            <>
              <span className="routine-member-readout__avatar">
                {activeMember.avatar ? (
                  <img src={activeMember.avatar} alt="" loading="lazy" />
                ) : (
                  activeMember.name.charAt(0)
                )}
              </span>
              <span className="routine-member-readout__identity">
                <strong>{activeMember.name}</strong>
                <small>{activeMember.title}</small>
              </span>
              <span className="routine-member-readout__bio">
                {activeMember.bio ?? "正在与同行者一起，把好奇变成可以抵达的航线。"}
              </span>
              <span className="routine-member-readout__posts">
                <strong>{activeMember.postCount}</strong>
                <small>篇公开文章</small>
              </span>
            </>
          ) : (
            <>
              <span className="routine-member-readout__signal" aria-hidden="true" />
              <span className="routine-member-readout__identity">
                <strong>{members.length} 位同行者</strong>
                <small>灯火沿着不同航线继续向前</small>
              </span>
            </>
          )}
        </div>

        <div className="routine-member-stream__current" aria-hidden="true" />
        {members.length === 0 ? (
          <p className="routine-member-stream__empty">成员信号仍在等待接入。</p>
        ) : (
          members.map((member, index) => {
            const hash = stableHash(member.id);
            const lane = hash % 3;
            const direction = index % 2 === 0 ? "ltr" : "rtl";
            const duration = 27 + (hash % 13);
            const style: FishStyle = {
              "--fish-delay": `${-((index * 4.75) % duration)}s`,
              "--fish-duration": `${duration}s`,
              "--fish-lane": String(lane),
              "--fish-mobile-lane": String(lane % 2),
              "--fish-scale": String(0.88 + (hash % 17) / 100),
            };

            return (
              <Link
                key={member.id}
                href={`/friends/${member.username}`}
                className="routine-member-fish"
                data-direction={direction}
                data-active={activeMemberId === member.id}
                style={style}
                onMouseEnter={() => setActiveMemberId(member.id)}
                onMouseLeave={() => setActiveMemberId(null)}
                onFocus={() => setActiveMemberId(member.id)}
                onBlur={() => setActiveMemberId(null)}
                aria-label={`进入${member.name}的成员主页`}
              >
                <span className="routine-member-fish__name">{member.name}</span>
                <span className="routine-member-fish__lead" aria-hidden="true" />
                <MemberFishGraphic />
              </Link>
            );
          })
        )}
      </section>

      {selectedPhoto && selectedPhotoIndex !== null && (
        <div
          className="routine-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="照片查看器"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            className="routine-lightbox__close"
            onClick={closeLightbox}
            aria-label="关闭照片查看器"
            title="关闭"
          >
            <X size={22} aria-hidden="true" />
          </button>
          {visiblePhotos.length > 1 && (
            <>
              <button
                type="button"
                className="routine-lightbox__previous"
                onClick={showPreviousPhoto}
                aria-label="查看上一张照片"
                title="上一张"
              >
                <ChevronLeft size={26} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="routine-lightbox__next"
                onClick={showNextPhoto}
                aria-label="查看下一张照片"
                title="下一张"
              >
                <ChevronRight size={26} aria-hidden="true" />
              </button>
            </>
          )}
          <figure>
            <img src={selectedPhoto.imagePath} alt={selectedPhoto.caption ?? "科协日常照片"} />
            <figcaption>
              <span>{selectedPhoto.caption ?? "科协日常照片"}</span>
              <small>
                {selectedPhotoIndex + 1} / {visiblePhotos.length}
              </small>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
