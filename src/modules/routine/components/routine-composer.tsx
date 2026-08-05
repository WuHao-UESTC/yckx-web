"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ImagePlus, MessageSquareText, NotebookPen, Upload } from "lucide-react";

export function RoutineComposer({
  noteCount,
  photoCount,
  dailyPostCount,
}: {
  noteCount: number;
  photoCount: number;
  dailyPostCount: number;
}) {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [caption, setCaption] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pending, setPending] = useState<"note" | "photo" | null>(null);
  const [message, setMessage] = useState("");

  async function publishNote() {
    setPending("note");
    setMessage("");
    try {
      const response = await fetch("/api/sticky-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note, isAnonymous }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "留言发布失败");
      setNote("");
      setIsAnonymous(false);
      setMessage("留言已发布");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "留言发布失败");
    } finally {
      setPending(null);
    }
  }

  async function publishPhoto() {
    if (!photoFile) {
      setMessage("请先选择照片");
      return;
    }

    setPending("photo");
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("file", photoFile);
      formData.set("purpose", "PHOTO");
      const uploadResponse = await fetch("/api/files/upload", { method: "POST", body: formData });
      const uploaded = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploaded.error ?? "照片上传失败");

      const response = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: uploaded.id, caption: caption || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "照片发布失败");

      setPhotoFile(null);
      setCaption("");
      if (photoInputRef.current) photoInputRef.current.value = "";
      setMessage("照片与感悟已发布");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "照片发布失败");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="routine-composer">
      <header className="workspace-panel-heading">
        <span>DAILY LOG CHANNELS</span>
        <h1>写日常</h1>
        <p>轻量留言、同行影像与阶段性长文使用不同的记录方式，并共同汇入科协日常。</p>
      </header>

      <dl className="routine-composer__readouts">
        <div>
          <dt>我的留言</dt>
          <dd>{noteCount}</dd>
        </div>
        <div>
          <dt>我的照片</dt>
          <dd>{photoCount}</dd>
        </div>
        <div>
          <dt>日常专栏文章</dt>
          <dd>{dailyPostCount}</dd>
        </div>
      </dl>

      <section className="routine-composer__channel" aria-labelledby="routine-note-title">
        <div className="routine-composer__channel-heading">
          <MessageSquareText size={20} aria-hidden="true" />
          <div>
            <small>QUICK NOTE</small>
            <h2 id="routine-note-title">留言</h2>
          </div>
          <span>最多 200 字</span>
        </div>
        <textarea
          value={note}
          maxLength={200}
          onChange={(event) => setNote(event.target.value)}
          placeholder="留下一条给同行者的便签…"
        />
        <div className="routine-composer__channel-actions">
          <label>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
            />
            匿名发布
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={!note.trim() || pending !== null}
            onClick={() => void publishNote()}
          >
            {pending === "note" ? "发布中" : "发布留言"}
          </button>
        </div>
      </section>

      <section className="routine-composer__channel" aria-labelledby="routine-photo-title">
        <div className="routine-composer__channel-heading">
          <ImagePlus size={20} aria-hidden="true" />
          <div>
            <small>FIELD IMAGE</small>
            <h2 id="routine-photo-title">照片与感悟</h2>
          </div>
          <span>JPEG / PNG / WebP</span>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="routine-composer__file-picker"
          onClick={() => photoInputRef.current?.click()}
        >
          <Upload size={17} aria-hidden="true" />
          <span>{photoFile?.name ?? "选择一张照片"}</span>
        </button>
        <textarea
          value={caption}
          maxLength={2000}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="写下这张照片背后的事情、感悟或必要描述…"
        />
        <div className="routine-composer__channel-actions routine-composer__channel-actions--end">
          <button
            type="button"
            className="btn-primary"
            disabled={!photoFile || pending !== null}
            onClick={() => void publishPhoto()}
          >
            {pending === "photo" ? "发布中" : "发布照片"}
          </button>
        </div>
      </section>

      <Link href="/dashboard/editor/daily" className="routine-composer__longform">
        <NotebookPen size={22} aria-hidden="true" />
        <span>
          <small>LONGFORM LOG</small>
          <strong>撰写日常专栏</strong>
          <p>适合年度总结、阶段复盘、活动手记等完整文章。</p>
        </span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </Link>

      {message && (
        <p className="routine-composer__status" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
