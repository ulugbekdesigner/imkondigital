import Link from 'next/link';
import { GlassCard } from '@imkon/ui';
import type { CourseGalleryItem } from '@/lib/types';

export function CourseGallery({ items }: { items: CourseGalleryItem[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="gallery-title" className="mt-10">
      <h2 id="gallery-title" className="font-display text-lg font-semibold text-ink">
        O'quvchilar ishlari
      </h2>
      <p className="mt-1 font-sans text-sm text-ink-soft">
        Bu kursni o'rgangan o'quvchilarning haqiqiy topshiriq ishlari.
      </p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <GlassCard hover className="h-full p-4">
              <h3 className="font-sans text-base font-semibold text-ink">{item.title}</h3>
              {item.description && (
                <p className="mt-1 line-clamp-3 font-sans text-sm text-ink-soft">
                  {item.description}
                </p>
              )}
              <Link
                href={`/u/${item.student_username}`}
                className="mt-3 inline-block rounded font-mono text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                @{item.student_username}
              </Link>
            </GlassCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
