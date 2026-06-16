"use client";

import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  currentUrl?: string;
  folder?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  accept?: string;
  label?: string;
};

export default function ImageUpload({
  currentUrl,
  folder,
  onUpload,
  onRemove,
  accept = "image/jpeg,image/png,image/webp",
  label = "Upload image",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("File too large. Max 20 MB.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (folder) fd.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Upload failed.");
        setPreview(currentUrl ?? null);
        return;
      }

      onUpload(data.url);
      setPreview(data.url);
    } catch {
      alert("Upload failed. Check your connection.");
      setPreview(currentUrl ?? null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />

      {preview ? (
        <div className="relative inline-block overflow-hidden rounded-xl border border-border">
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-32 object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition-colors hover:bg-black/40">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-ghost rounded-full bg-white/80 p-1.5 text-xs"
              title="Change image"
            >
              <Upload size={14} />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="btn-ghost rounded-full bg-white/80 p-1.5 text-xs text-red"
                title="Remove image"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
              <span className="text-xs font-medium text-white">Uploading…</span>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-surface text-xs text-muted transition-colors hover:border-green hover:text-green"
        >
          {uploading ? (
            <span>Uploading…</span>
          ) : (
            <>
              <Upload size={20} />
              {label}
            </>
          )}
        </button>
      )}
    </div>
  );
}
