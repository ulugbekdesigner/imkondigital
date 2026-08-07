import Link from 'next/link';
import { buttonVariants, cn } from '@imkon/ui';
import { ChevronRightIcon } from '@/components/shell-icons';
import { COURSE_CATEGORIES } from '@/lib/course-categories';

const STEP_BG = ['bg-step-0', 'bg-step-1', 'bg-step-2', 'bg-step-3', 'bg-step-4'];

export function CourseCategoryGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {COURSE_CATEGORIES.map((c) => (
        <li key={c.key} className="flex flex-col rounded-lg border border-line bg-paper p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded font-mono text-base font-bold text-deep',
                STEP_BG[c.step],
              )}
              aria-hidden="true"
            >
              {c.key}
            </span>
            <span className="font-mono text-xs text-ink-soft">Pog‘ona {c.step}</span>
          </div>
          <h3 className="font-display text-base font-semibold text-ink">{c.title}</h3>
          <ul className="mt-2 flex flex-col gap-1">
            {c.examples.map((e) => (
              <li key={e} className="font-sans text-base text-ink-soft">
                {e}
              </li>
            ))}
          </ul>
          {c.key === 'I' && (
            <Link
              href="/daraja-testi"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'mt-3 self-start bg-mint text-primary hover:brightness-95',
              )}
            >
              Darajangizni aniqlang
              <ChevronRightIcon width={14} height={14} aria-hidden="true" />
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
