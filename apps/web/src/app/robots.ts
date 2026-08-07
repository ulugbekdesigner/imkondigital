import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://imkondigital.uz';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Shaxsiy va xizmat sahifalari indekslanmaydi
      disallow: ['/profil', '/trayektoriya', '/ish-beruvchi', '/api/', '/dev/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
