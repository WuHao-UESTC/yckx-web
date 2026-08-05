"use client";

import { useRef, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminGroupPhotoUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [caption, setCaption] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function upload() {
    if (!file) {
      setMessage("请先选择合照文件");
      return;
    }

    setPending(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", "PHOTO");
      const uploadResponse = await fetch("/api/files/upload", { method: "POST", body: formData });
      const uploaded = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploaded.error ?? "合照文件上传失败");

      const response = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: uploaded.id,
          caption: caption || null,
          kind: "GROUP",
          year: Number(year),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "合照发布失败");

      setFile(null);
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("合照已加入科协日常顶部档案");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "合照上传失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card mb-8" aria-labelledby="group-photo-upload-title">
      <div className="mb-4 flex items-start gap-3">
        <ImagePlus className="mt-1 text-[#8b5e3c]" size={20} aria-hidden="true" />
        <div>
          <h2 id="group-photo-upload-title" className="text-lg font-semibold text-[#1a1a1a]">
            上传顶部合照
          </h2>
          <p className="mt-1 text-sm text-[#6b6b6b]">
            合照只由管理员维护，在科协日常标题右侧横向展示。
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px]">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="input-field flex min-h-11 w-full items-center gap-2 text-left text-[#4f5d58]"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={17} aria-hidden="true" />
            <span className="truncate">{file?.name ?? "选择 JPEG、PNG 或 WebP 合照"}</span>
          </button>
        </div>
        <label className="text-sm text-[#6b6b6b]">
          <span className="mb-1 block">年份</span>
          <input
            className="input-field w-full"
            type="number"
            min="1900"
            max="2200"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm text-[#6b6b6b]">
        <span className="mb-1 block">合照说明（可选）</span>
        <input
          className="input-field w-full"
          maxLength={2000}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="例如：2026 届科协成员合影"
        />
      </label>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-[#6b6b6b]" role="status">
          {message}
        </p>
        <button
          type="button"
          className="btn-primary shrink-0"
          disabled={!file || !year || pending}
          onClick={() => void upload()}
        >
          {pending ? "上传中" : "上传合照"}
        </button>
      </div>
    </section>
  );
}
