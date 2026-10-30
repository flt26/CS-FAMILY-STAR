import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { SPOTS } from '@/lib/spots';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    ...SPOTS.map((spot) => ({
      url: `${SITE_URL}/spot/${spot.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
