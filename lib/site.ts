// Absolute base for metadata, the sitemap and share images. Vercel provides
// VERCEL_PROJECT_PRODUCTION_URL; set NEXT_PUBLIC_SITE_URL for a custom domain.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

export const SITE_NAME = 'CS Family Star';
