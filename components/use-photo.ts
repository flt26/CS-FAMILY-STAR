'use client';

import { useEffect, useState } from 'react';
import { compressImage } from '@/lib/compress-image';

export type PhotoStatus = 'empty' | 'working' | 'ready' | 'unreadable';

/** Holds the shrunk photo the rating form will upload, plus its preview URL. */
export function usePhoto() {
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [status, setStatus] = useState<PhotoStatus>('empty');

  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.url);
  }, [photo]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setStatus('working');
    try {
      const small = await compressImage(file);
      setPhoto({ file: small, url: URL.createObjectURL(small) });
      setStatus('ready');
    } catch {
      setPhoto(null);
      setStatus('unreadable');
    }
  }

  function clear() {
    setPhoto(null);
    setStatus('empty');
  }

  return { file: photo?.file ?? null, preview: photo?.url ?? null, status, pick, clear };
}
