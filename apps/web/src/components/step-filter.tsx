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

export function StepFilter({
  active,
  isFree,
  q,
}: {
  active: number | undefined;
  isFree: boolean | undefined;
  q?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">Pog'ona</span>
      <nav aria-label="Narvon pog'onasi bo'yicha filtr">
        <ul className="flex flex-wrap gap-2">
          {STEPS.map((s) => {
            const isActive = s.value === active;
            const search = new URLSearchParams();
            if (s.value !== undefined) search.set('step', String(s.value));
            if (isFree !== undefined) search.set('is_free', String(isFree));
            if (q) search.set('q', q);
            const href = `/kurslar${search.toString() ? `?${search.toString()}` : ''}`;
            return (
              <li key={s.label}>
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-touch items-center rounded-full border px-4 font-sans text-sm font-semibold',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                    isActive
                      ? s.value === undefined
                        ? 'border-ink bg-ink text-paper'
                        : 'border-bright bg-bright text-white'
                      : 'border-line text-primary hover:bg-surface-2',
                  )}
                >
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
