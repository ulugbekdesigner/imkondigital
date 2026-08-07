import Link from 'next/link';
import { cn } from '@imkon/ui';
import { GIG_CATEGORIES } from '@/lib/gig-categories';

export function GigCategoryFilter({ active, q }: { active: string | undefined; q?: string }) {
  const options: { value: string | undefined; label: string }[] = [
    { value: undefined, label: 'Hammasi' },
    ...GIG_CATEGORIES.map((c) => ({ value: c as string | undefined, label: c })),
  ];

  return (
    <nav aria-label="Kategoriya bo'yicha filtr">
      <ul className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = opt.value === active;
          const search = new URLSearchParams();
          if (opt.value) search.set('category', opt.value);
          if (q) search.set('q', q);
          const href = `/gigs${search.toString() ? `?${search.toString()}` : ''}`;
          return (
            <li key={opt.label}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-touch items-center rounded-full border px-4 font-sans text-sm font-semibold',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                  isActive
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-primary hover:bg-surface-2',
                )}
              >
                {opt.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
