import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'PENRO Batanes ICT Inventory',
    short_name: 'ICT Inventory',
    description: 'Manage PENRO Batanes ICT equipment and maintenance records.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#047857',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
