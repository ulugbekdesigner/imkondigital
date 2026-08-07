import Link from 'next/link';
import { cn } from '@imkon/ui';

const FORMATS = [
  { value: undefined, label: 'Hammasi' },
  { value: 'remote', label: '100% Remote' },
  { value: 'hybrid', label: 'Gibrid' },
  { value: 'office', label: 'Ofisda' },
];

export function WorkFormatFilter({
  active,
  regionId,
  step,
  minSalary,
}: {
  active: string | undefined;
  regionId?: string;
  step?: string;
  minSalary?: string;
}) {
  return (
    <nav aria-label="Ish formati bo'yicha filtr">
      <ul className="flex flex-wrap gap-2">
        {FORMATS.map((f) => {
          const isActive = f.value === active;
          const params = new URLSearchParams();
          if (f.value !== undefined) params.set('format', f.value);
          if (regionId) params.set('region_id', regionId);
          if (step) params.set('step', step);
          if (minSalary) params.set('min_salary', minSalary);
          const qs = params.toString();
          const href = qs ? `/vakansiyalar?${qs}` : '/vakansiyalar';
          return (
            <li key={f.label}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-touch items-center rounded-full border px-4 font-sans text-base',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                  isActive
                    ? 'border-primary bg-primary text-primary-fg'
                    : 'border-line text-ink hover:bg-mint',
                )}
              >
                {f.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
