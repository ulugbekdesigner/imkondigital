'use client';

import { useRouter } from 'next/navigation';
import type { Region } from '@/lib/types';

export function RegionFilter({
  regions,
  active,
  format,
  step,
  minSalary,
}: {
  regions: Region[];
  active: string | undefined;
  format: string | undefined;
  step?: string;
  minSalary?: string;
}) {
  const router = useRouter();
  if (regions.length === 0) return null;

  function goTo(regionId: string) {
    const params = new URLSearchParams();
    if (format) params.set('format', format);
    if (step) params.set('step', step);
    if (minSalary) params.set('min_salary', minSalary);
    if (regionId) params.set('region_id', regionId);
    const qs = params.toString();
    router.push(qs ? `/vakansiyalar?${qs}` : '/vakansiyalar');
  }

  return (
    <div className="mt-3 flex flex-col gap-1.5 sm:max-w-xs">
      <label htmlFor="region-filter-select" className="font-sans text-sm font-medium text-ink-soft">
        Hudud bo'yicha filtr
      </label>
      <select
        id="region-filter-select"
        value={active ?? ''}
        onChange={(e) => goTo(e.target.value)}
        className="min-h-touch w-full rounded border border-line bg-paper px-3 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
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
