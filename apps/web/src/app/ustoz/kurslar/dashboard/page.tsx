import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getInstructorDashboard, getInstructorStudents } from '@/lib/instructor-studio-api';
import { getMyNotifications } from '@/lib/notifications-api';
import { BecomeInstructorButton } from '@/components/become-instructor-button';
import { ImpactCertificateButton } from '@/components/impact-certificate-button';
import { InstructorPlacementCelebration } from '@/components/instructor-placement-celebration';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { buttonVariants, cn } from '@imkon/ui';
import {
  AlertIcon,
  CheckIcon,
  ChevronRightIcon,
  RefreshIcon,
  StarIcon,
  UsersIcon,
} from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Dashboard — Ustoz kabineti',
  robots: { index: false },
};

export default async function InstructorDashboardPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/ustoz/kurslar/dashboard');

  if (!me.roles.includes('instructor') && !me.roles.includes('admin')) {
    return (
      <div className="max-w-3xl">
        <CabinetPageHeader title="Dashboard" />
        <BecomeInstructorButton />
      </div>
    );
  }

  const [dashboard, students, notifications] = await Promise.all([
    getInstructorDashboard(),
    getInstructorStudents(),
    getMyNotifications(),
  ]);
  const stuckStudents = students.filter((s) => s.is_stuck);
  const activeStudentsCount = students.length - stuckStudents.length;
  const placementNotifications = notifications.items.filter(
    (n) => n.type === 'student_placed' && !n.read_at,
  );

  return (
    <div className="max-w-3xl">
      {placementNotifications.length > 0 && (
        <InstructorPlacementCelebration notifications={placementNotifications} />
      )}
      <CabinetPageHeader
        title="Dashboard"
        subtitle={
          dashboard
            ? `${dashboard.courses_count} kurs · ${dashboard.students_count} o'quvchi`
            : undefined
        }
      />

      {dashboard ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper p-4">
              <UsersIcon width={20} height={20} className="text-primary" />
              <p className="font-mono text-2xl font-bold text-ink">{dashboard.students_count}</p>
              <p className="font-sans text-xs text-ink-soft">
                O&apos;quvchilar
                {dashboard.new_students_this_month > 0 &&
                  ` · +${dashboard.new_students_this_month} shu oyda`}
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper p-4">
              <StarIcon width={20} height={20} className="text-primary" />
              <p className="font-mono text-2xl font-bold text-ink">
                {dashboard.completion_rate_pct}%
              </p>
              <p className="font-sans text-xs text-ink-soft">
                Tugatish
                {dashboard.average_rating !== null &&
                  ` · o'rtacha reyting ${dashboard.average_rating}`}
              </p>
            </div>
          </div>

          {dashboard.most_dropped_lesson_title && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-warn bg-warn-bg p-4">
              <AlertIcon width={18} height={18} className="mt-0.5 shrink-0 text-warn" />
              <div>
                <p className="font-sans text-base font-semibold text-ink">
                  Eng ko&apos;p tashlab ketilgan dars: {dashboard.most_dropped_lesson_title}
                </p>
                {dashboard.most_dropped_lesson_pct !== null && (
                  <p className="mt-1 font-sans text-sm text-ink-soft">
                    O&apos;quvchilarning {dashboard.most_dropped_lesson_pct}% shu darsda
                    to&apos;xtagan. Tavsiya: darsni ikkiga bo&apos;ling yoki qo&apos;shimcha
                    mashq qo&apos;shing.
                  </p>
                )}
              </div>
            </div>
          )}

          {students.length > 0 && (
            <section
              className="mt-4 rounded-xl border border-line bg-paper p-4"
              aria-labelledby="dash-activity-title"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="dash-activity-title" className="font-display text-base font-bold text-ink">
                  O&apos;quvchilar faolligi
                </h2>
                <Link
                  href="/ustoz/kurslar/oquvchilar"
                  className="inline-flex min-h-touch items-center gap-1 font-sans text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  Barchasini ko&apos;rish
                  <ChevronRightIcon width={16} height={16} aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 font-sans text-sm text-ink">
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-success" />
                  {activeStudentsCount} faol
                </span>
                <span className="flex items-center gap-1.5 font-sans text-sm text-ink">
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-warn" />
                  {stuckStudents.length} 14+ kun faolsiz
                </span>
              </div>
              {stuckStudents.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {stuckStudents.slice(0, 3).map((s) => (
                    <li
                      key={`${s.course_id}-${s.user_id}`}
                      className="flex items-center justify-between gap-3 font-sans text-sm text-ink-soft"
                    >
                      <span className="truncate text-ink">{s.full_name}</span>
                      <span className="shrink-0">{s.course_title} · {s.progress_pct}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-paper p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
                <StarIcon width={20} height={20} />
              </span>
              <div className="flex-1">
                <p className="font-sans text-base font-semibold text-ink">Ta&apos;sir sertifikati</p>
                <p className="font-sans text-sm text-ink-soft">
                  Bepul kurslaringiz orqali {dashboard.free_completions_count} kishi kasb
                  o&apos;rgandi
                </p>
              </div>
            </div>
            <ImpactCertificateButton />
          </div>

          <section style={{ marginTop: 'var(--sp-10)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="t-h2 text-ink">Diqqat talab qiladi</h2>
              {dashboard.oldest_ungraded.length > 0 && (
                <Link
                  href="/ustoz/kurslar/topshiriqlar"
                  className="inline-flex min-h-touch items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  Barchasini ko&apos;rish
                  <ChevronRightIcon width={16} height={16} />
                </Link>
              )}
            </div>

            {dashboard.oldest_ungraded.length > 0 ? (
              <ul style={{ marginTop: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                {dashboard.oldest_ungraded.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-line px-4"
                    style={{ minHeight: 'var(--h-table-row)' }}
                  >
                    <div className="flex items-center gap-3">
                      <AlertIcon width={18} height={18} className="text-warn shrink-0" />
                      <div>
                        <p className="t-body text-ink">
                          {s.student_name} — {s.assignment_title}
                        </p>
                        <p className="t-caption text-ink-soft">{s.course_title}</p>
                      </div>
                    </div>
                    <Link
                      href="/ustoz/kurslar/topshiriqlar"
                      className="inline-flex min-h-touch items-center text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                    >
                      Ko&apos;rish
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                style={{
                  marginTop: 'var(--sp-3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-3)',
                  padding: 'var(--sp-5) var(--sp-6)',
                  border: '1px dashed var(--c-line)',
                  borderRadius: 'var(--r-card)',
                }}
              >
                <CheckIcon width={20} height={20} className="text-primary shrink-0" />
                <p className="t-body text-ink-soft">Hozircha tekshirish kerak bo&apos;lgan narsa yo&apos;q.</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="imk-error" role="alert">
          <span aria-hidden="true" className="imk-error__icon">
            <AlertIcon width={22} height={22} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-sans text-base font-bold text-ink">Dashboard ma&apos;lumotlarini yuklab bo&apos;lmadi</p>
            <p className="font-sans text-sm text-ink-soft">
              Internet aloqasi yoki serverda vaqtinchalik muammo bo&apos;lishi mumkin.
            </p>
          </div>
          <Link href="/ustoz/kurslar/dashboard" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
            <RefreshIcon width={16} height={16} aria-hidden="true" />
            Qayta urinish
          </Link>
        </div>
      )}
    </div>
  );
}
