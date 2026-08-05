"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export function AvatarUploader({ initialAvatar }: { initialAvatar: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<"upload" | "remove" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function selectFile(nextFile: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = nextFile ? URL.createObjectURL(nextFile) : null;
    setPreview(previewRef.current);
    setFile(nextFile);
  }

  async function uploadAvatar() {
    if (!file) return;
    setPending("upload");
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/users/avatar", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "头像上传失败");
      setAvatar(result.avatar);
      selectFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setMessage("头像已更新");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setPending(null);
    }
  }

  async function removeAvatar() {
    if (!window.confirm("确定移除当前头像吗？")) return;
    setPending("remove");
    setMessage("");
    try {
      const response = await fetch("/api/users/avatar", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "头像移除失败");
      setAvatar(null);
      selectFile(null);
      setMessage("头像已移除");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "头像移除失败");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="profile-avatar-control" aria-labelledby="profile-avatar-title">
      <div className="profile-avatar-control__preview">
        {preview || avatar ? (
          <img src={preview ?? avatar ?? ""} alt="头像预览" />
        ) : (
          <ImagePlus size={28} aria-hidden="true" />
        )}
      </div>
      <div className="profile-avatar-control__body">
        <small>PROFILE IMAGE</small>
        <h2 id="profile-avatar-title">头像文件</h2>
        <p>JPEG、PNG 或 WebP，最大 5MB。上传后统一处理为方形 WebP。</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
        />
        <div className="profile-avatar-control__actions">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending !== null}
          >
            <ImagePlus size={15} aria-hidden="true" />
            <span>{file?.name ?? "选择图片"}</span>
          </button>
          <button
            type="button"
            onClick={() => void uploadAvatar()}
            disabled={!file || pending !== null}
          >
            <Upload size={15} aria-hidden="true" />
            <span>{pending === "upload" ? "上传中" : "上传头像"}</span>
          </button>
          {avatar && (
            <button
              type="button"
              className="profile-avatar-control__remove"
              onClick={() => void removeAvatar()}
              disabled={pending !== null}
              title="移除头像"
            >
              <Trash2 size={15} aria-hidden="true" />
              <span className="sr-only">移除头像</span>
            </button>
          )}
        </div>
        {message && <p role="status">{message}</p>}
      </div>
    </section>
  );
}
