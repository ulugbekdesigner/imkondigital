'use client';

import { useRouter } from 'next/navigation';
import type { Region } from '@/lib/types';

export function CourseRegionFilter({
  regions,
  active,
  step,
  isFree,
  q,
}: {
  regions: Region[];
  active: string | undefined;
  step: number | undefined;
  isFree: boolean | undefined;
  q: string | undefined;
}) {
  const router = useRouter();
  if (regions.length === 0) return null;

  function goTo(regionId: string) {
    const params = new URLSearchParams();
    if (step !== undefined) params.set('step', String(step));
    if (isFree !== undefined) params.set('is_free', String(isFree));
    if (q) params.set('q', q);
    if (regionId) params.set('region_id', regionId);
    const qs = params.toString();
    router.push(qs ? `/kurslar?${qs}` : '/kurslar');
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="course-region-filter" className="sr-only">
        Hudud bo'yicha filtr
      </label>
      <select
        id="course-region-filter"
        value={active ?? ''}
        onChange={(e) => goTo(e.target.value)}
        className="min-h-touch rounded border border-line bg-paper px-3 font-sans text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <option value="">Barcha hududlar</option>
        {regions.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
