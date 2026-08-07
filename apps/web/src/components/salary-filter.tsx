'use client';

import { useRouter } from 'next/navigation';

const THRESHOLDS = [
  { value: '', label: 'Istalgan maosh' },
  { value: '2000000', label: '2 mln so‘mdan' },
  { value: '5000000', label: '5 mln so‘mdan' },
  { value: '8000000', label: '8 mln so‘mdan' },
  { value: '12000000', label: '12 mln so‘mdan' },
  { value: '20000000', label: '20 mln so‘mdan' },
];

/** Vakansiyalar katalogida eng kam maosh bo'yicha filtr — boshqa faol filtrlarni saqlab qoladi. */
export function SalaryFilter({
  active,
  format,
  regionId,
  step,
}: {
  active: string | undefined;
  format?: string;
  regionId?: string;
  step?: string;
}) {
  const router = useRouter();

  function goTo(minSalary: string) {
    const params = new URLSearchParams();
    if (format) params.set('format', format);
    if (regionId) params.set('region_id', regionId);
    if (step) params.set('step', step);
    if (minSalary) params.set('min_salary', minSalary);
    const qs = params.toString();
    router.push(qs ? `/vakansiyalar?${qs}` : '/vakansiyalar');
  }

  return (
    <div className="flex flex-col gap-1.5 sm:max-w-xs">
      <label htmlFor="salary-filter-select" className="font-sans text-sm font-medium text-ink-soft">
        Maosh bo'yicha filtr
      </label>
      <select
        id="salary-filter-select"
        value={active ?? ''}
        onChange={(e) => goTo(e.target.value)}
        className="min-h-touch w-full rounded border border-line bg-paper px-3 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        {THRESHOLDS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
