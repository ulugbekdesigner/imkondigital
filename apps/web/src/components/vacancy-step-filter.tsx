import Link from 'next/link';
import { cn } from '@imkon/ui';

const STEPS = [
  { value: undefined, label: 'Hammasi' },
  { value: 0, label: '0 · Savodxonlik' },
  { value: 1, label: '1 · Yordamchi' },
  { value: 2, label: '2 · Mutaxassislik' },
  { value: 3, label: '3 · Ixtisos' },
  { value: 4, label: '4 · Tadbirkorlik' },
];

/** Vakansiyalar katalogida narvon pog'onasi bo'yicha filtr — boshqa faol filtrlarni saqlab qoladi. */
export function VacancyStepFilter({
  active,
  format,
  regionId,
  minSalary,
}: {
  active: number | undefined;
  format?: string;
  regionId?: string;
  minSalary?: string;
}) {
  return (
    <nav aria-label="Narvon pog'onasi bo'yicha filtr">
      <ul className="flex flex-wrap gap-2">
        {STEPS.map((s) => {
          const isActive = s.value === active;
          const search = new URLSearchParams();
          if (format) search.set('format', format);
          if (regionId) search.set('region_id', regionId);
          if (minSalary) search.set('min_salary', minSalary);
          if (s.value !== undefined) search.set('step', String(s.value));
          const qs = search.toString();
          const href = qs ? `/vakansiyalar?${qs}` : '/vakansiyalar';
          return (
            <li key={s.label}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-touch items-center rounded-full border px-4 font-sans text-sm font-semibold',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                  isActive
                    ? 'border-primary bg-primary text-primary-fg'
                    : 'border-line text-ink hover:bg-mint',
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
