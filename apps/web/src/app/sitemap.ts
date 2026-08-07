import type { MetadataRoute } from 'next';
import { getRegions } from '@/lib/regions-api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://imkondigital.uz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    '',
    '/kurslar',
    '/ish-beruvchilarga',
    '/donorlarga',
    '/xayriya',
    '/hududlar',
    '/haqida',
    '/aloqa',
    '/verify',
  ];
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const regions = await getRegions();
  const regionEntries: MetadataRoute.Sitemap = regions.map((r) => ({
    url: `${SITE_URL}/hududlar/${r.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticEntries, ...regionEntries];
}
