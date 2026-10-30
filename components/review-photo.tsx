'use client';

import Image from 'next/image';
import { useRef } from 'react';

/** A review photo: a thumbnail on the slip, full size in a lightbox. */
export function ReviewPhoto({ src, alt }: { src: string; alt: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="slip__photo" onClick={() => dialogRef.current?.showModal()}>
        <Image src={src} alt={alt} fill sizes="(min-width: 1080px) 340px, (min-width: 720px) 45vw, 92vw" />
        <span className="sr-only">Open the full photo</span>
      </button>
      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label={alt}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <Image src={src} alt={alt} width={1600} height={1200} sizes="min(960px, 100vw)" />
        <button type="button" onClick={() => dialogRef.current?.close()}>
          Close
        </button>
      </dialog>
    </>
  );
}
