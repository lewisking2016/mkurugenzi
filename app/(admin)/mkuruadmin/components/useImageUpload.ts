'use client';

import React from 'react';

/**
 * Shared upload logic for product images.
 *
 * Posts to /api/admin/upload and returns the stored path (/uploads/…). Used by
 * both the editor's ImagePicker and the one-click photo button on each product
 * card, so the two behave identically.
 */

export const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function useImageUpload(onUploaded: (url: string) => void) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const open = () => inputRef.current?.click();

  const upload = async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('That file is not an image. Use a JPEG, PNG, WebP, AVIF or GIF.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('That image is over 8 MB. Please resize it and try again.');
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || 'Upload failed');
      }
      onUploaded((payload as { url: string }).url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      // Reset so re-picking the same file still fires a change event.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  /** Props to spread straight onto a hidden <input type="file" />. */
  const inputProps = {
    ref: inputRef,
    type: 'file' as const,
    accept: ACCEPT_IMAGES,
    className: 'hidden',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void upload(file);
    },
  };

  return { open, upload, inputProps, busy, error };
}
