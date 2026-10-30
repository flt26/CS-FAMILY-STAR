// Phone photos are 3–12 MB; a review photo needs ~300 KB. Shrinking in the
// browser keeps uploads fast on mobile data and well under the server limit.

const MAX_EDGE = 1600;

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Throws when the browser cannot decode the file (e.g. HEIC outside Safari). */
export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Browsers that cannot encode WebP quietly hand back a PNG instead.
  let blob = await encode(canvas, 'image/webp', 0.82);
  if (!blob || blob.type !== 'image/webp') blob = await encode(canvas, 'image/jpeg', 0.85);
  if (!blob) throw new Error('Could not encode the photo');

  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${base}.${extension}`, { type: blob.type });
}
