'use client';

import React from 'react';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { useImageUpload } from './useImageUpload';

/**
 * Image field for the product editor: pick a file from your machine and it is
 * uploaded to /uploads, or paste an existing path. Both end up in the same
 * `value` so the rest of the form does not care which one was used.
 */
export default function ImagePicker({
  label, value, onChange, hint, compact = false,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  compact?: boolean;
}) {
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const { open, upload, inputProps, busy, error } = useImageUpload((url) => {
    // Swap the throwaway blob for the stored URL once the server has it.
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    onChange(url);
  });

  React.useEffect(
    () => () => { if (localPreview) URL.revokeObjectURL(localPreview); },
    [localPreview],
  );

  const preview = localPreview || value;

  const handleFile = (file: File) => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    void upload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    onChange('');
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
  };

  return (
    <div>
      <span className="block text-xs font-medium text-black/50 mb-1.5">{label}</span>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border border-dashed p-3 flex gap-4 transition-colors ${
          dragging ? 'border-[#0d0d0d] bg-[#f0f0f1]' : 'border-black/15 bg-white'
        }`}
      >
        <div className={`${compact ? 'w-16 h-20' : 'w-24 h-28'} shrink-0 rounded-lg bg-[#f0f0f1] overflow-hidden flex items-center justify-center`}>
          {preview ? (
            <img src={preview} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5 text-black/25" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/assets/images/…"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-all placeholder:text-black/30 focus:border-[#0d0d0d]"
          />

          <div className="flex flex-wrap items-center gap-2">
            <input {...inputProps} />
            <button
              type="button"
              onClick={open}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-[#0d0d0d] text-white text-xs font-medium px-4 py-2 transition-colors hover:bg-[#2a2a2a] disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {busy ? 'Uploading…' : 'Choose image'}
            </button>

            {value && (
              <button
                type="button"
                onClick={clear}
                aria-label="Remove image"
                className="w-8 h-8 rounded-full flex items-center justify-center text-black/35 hover:bg-[#f0f0f1] hover:text-[#0d0d0d] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <span className="text-[11px] text-black/35">or drop a file here</span>
          </div>

          {error && <p className="text-[11px] text-black/70 bg-[#f0f0f1] rounded-lg px-3 py-2">{error}</p>}
          {hint && <p className="text-[11px] text-black/35">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
