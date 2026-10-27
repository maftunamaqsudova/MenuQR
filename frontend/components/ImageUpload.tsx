"use client";

import { ChangeEvent, useRef, useState } from "react";
import { imageUrl } from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import { errMsg } from "@/lib/format";

type Props = {
  label: string;
  value: string | null;
  onChange: (path: string | null) => void;
  boxClass?: string;
};

export default function ImageUpload({ label, value, onChange, boxClass = "h-32 w-32" }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  const src = imageUrl(value);

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-end gap-3">
        <div className={`${boxClass} flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400`}>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            "No image"
          )}
        </div>
        <div className="flex flex-col items-start gap-1">
          <button type="button" disabled={busy} onClick={() => input.current?.click()}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-60">
            {busy ? "Uploading..." : value ? "Change" : "Upload"}
          </button>
          {value && !busy && (
            <button type="button" onClick={() => onChange(null)} className="text-sm text-gray-500 hover:text-red-600">
              Remove
            </button>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPick} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}