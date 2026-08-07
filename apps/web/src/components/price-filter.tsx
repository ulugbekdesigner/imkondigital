import Link from 'next/link';
import { cn } from '@imkon/ui';

const OPTIONS: { value: boolean | undefined; label: string }[] = [
  { value: undefined, label: 'Hammasi' },
  { value: true, label: 'Bepul' },
  { value: false, label: 'Pullik' },
];

export function PriceFilter({
  active,
  step,
  q,
}: {
  active: boolean | undefined;
  step: number | undefined;
  q?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">Narx</span>
      <div role="group" aria-label="Narx bo'yicha filtr" className="inline-flex rounded-full bg-surface-2 p-1">
        {OPTIONS.map((o) => {
          const isActive = o.value === active;
          const search = new URLSearchParams();
          if (step !== undefined) search.set('step', String(step));
          if (o.value !== undefined) search.set('is_free', String(o.value));
          if (q) search.set('q', q);
          const href = `/kurslar${search.toString() ? `?${search.toString()}` : ''}`;
          return (
            <Link
              key={o.label}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-touch items-center rounded-full px-4 font-sans text-sm font-semibold',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
              )}
            >
              {o.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
