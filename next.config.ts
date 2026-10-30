import type { NextConfig } from 'next';
import { REVIEW_IMAGES_BUCKET, SUPABASE_URL } from './lib/config';

const supabaseHost = new URL(SUPABASE_URL).hostname;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Photos are shrunk in the browser before upload; this leaves headroom for
    // an uncompressed fallback plus the multipart envelope.
    serverActions: { bodySizeLimit: '4mb' },
  },
  images: {
    remotePatterns: [new URL(`${SUPABASE_URL}/storage/v1/object/public/${REVIEW_IMAGES_BUCKET}/**`)],
    // Only for a local Supabase (`supabase start`), whose photos live on localhost.
    dangerouslyAllowLocalIP: supabaseHost === 'localhost' || supabaseHost === '127.0.0.1',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
