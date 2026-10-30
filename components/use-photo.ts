'use client';

import { useEffect, useRef, useState } from 'react';
import { compressImage } from '@/lib/compress-image';

export type PhotoStatus = 'empty' | 'working' | 'ready' | 'unreadable';

/** Holds the shrunk photo the rating form will upload, plus its preview URL. */
export function usePhoto() {
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [status, setStatus] = useState<PhotoStatus>('empty');
  // Shrinking takes a moment; only the latest pick (or a clear) may land.
  const latest = useRef(0);

  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.url);
  }, [photo]);

  async function pick(file: File | undefined) {
    if (!file) return;
    const ticket = ++latest.current;
    setStatus('working');
    try {
      const small = await compressImage(file);
      if (ticket !== latest.current) return;
      setPhoto({ file: small, url: URL.createObjectURL(small) });
      setStatus('ready');
    } catch {
      if (ticket !== latest.current) return;
      setPhoto(null);
      setStatus('unreadable');
    }
  }

  function clear() {
    latest.current++;
    setPhoto(null);
    setStatus('empty');
  }

  return { file: photo?.file ?? null, preview: photo?.url ?? null, status, pick, clear };
}
