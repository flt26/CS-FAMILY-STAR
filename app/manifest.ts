import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CS Family Star',
    short_name: 'CS Star',
    description: 'Where are we eating today? 100 food spots around FUE, rated by students.',
    start_url: '/',
    display: 'standalone',
    background_color: '#161412',
    theme_color: '#161412',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
