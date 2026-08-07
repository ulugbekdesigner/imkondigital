import Link from 'next/link';
import { StarIcon } from '@/components/shell-icons';
import { formatThousands } from '@/lib/format';
import type { CourseCard as CourseCardType } from '@/lib/types';

const STEP_TINT = ['var(--step-0)', 'var(--step-1)', 'var(--step-2)', 'var(--step-3)', 'var(--step-4)'];

export function CourseCard({ course }: { course: CourseCardType }) {
  const tint = STEP_TINT[course.ladder_step] ?? STEP_TINT[0];
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line bg-paper">
      <Link
        href={`/kurslar/${course.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <div
          className="relative flex h-[116px] shrink-0 items-start justify-between overflow-hidden p-3.5"
          style={
            course.cover_url
              ? undefined
              : { background: `linear-gradient(135deg, ${tint}, var(--paper))` }
          }
        >
          {course.cover_url && (
            <img
              src={course.cover_url}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <span className="relative rounded-full bg-paper px-2.5 py-1 font-sans text-xs font-bold text-primary">
            {course.ladder_step}-pog'ona
          </span>
          {course.is_free ? (
            <span className="relative rounded-full bg-success-bg px-2.5 py-1 font-sans text-xs font-bold text-success">
              Bepul
            </span>
          ) : (
            <span className="relative rounded-full bg-ink px-2.5 py-1 font-sans text-xs font-bold text-paper">
              {formatThousands(course.price)} so‘m
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-[18px]">
          <span className="font-display text-md font-bold text-ink">{course.title}</span>
          {course.description && (
            <p className="line-clamp-2 font-sans text-sm text-ink-soft">{course.description}</p>
          )}
          <div className="mt-auto flex flex-col gap-1 pt-2">
            <div className="flex items-center justify-between font-sans text-xs text-ink-soft">
              <span>
                {course.lessons_count} dars
                {course.duration_weeks !== null && ` · ${course.duration_weeks} hafta`}
              </span>
              {course.rating > 0 && (
                <span className="flex items-center gap-1 font-bold text-warn">
                  <StarIcon width={13} height={13} />
                  {course.rating.toFixed(1)}
                </span>
              )}
            </div>
            {course.region_name !== null && (
              <span className="font-sans text-xs text-ink-soft">{course.region_name}</span>
            )}
            {course.income_success_rate !== null && (
              <span className="font-sans text-xs text-ink-soft">
                {Math.round(course.income_success_rate)}% daromadga chiqdi
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
