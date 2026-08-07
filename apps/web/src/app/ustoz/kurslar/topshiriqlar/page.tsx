import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buttonVariants, cn } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getInstructorSubmissions } from '@/lib/instructor-studio-api';
import { BecomeInstructorButton } from '@/components/become-instructor-button';
import { SubmissionsQueueManager } from '@/components/submissions-queue-manager';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { ClipboardIcon, SearchIcon } from '@/components/shell-icons';
import { formatRelativeTime } from '@/lib/format';
import type { InstructorSubmissionItem } from '@/lib/types';

const OVERDUE_AFTER_MS = 24 * 60 * 60 * 1000;

export const metadata: Metadata = {
  title: 'Topshiriqlar — Ustoz kabineti',
  robots: { index: false },
};

type TabKey = 'pending' | 'graded' | 'all';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending', label: 'Kutilmoqda' },
  { key: 'graded', label: 'Tekshirilgan' },
  { key: 'all', label: 'Hammasi' },
];

export default async function InstructorSubmissionsPage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string };
}) {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/ustoz/kurslar/topshiriqlar');

  if (!me.roles.includes('instructor') && !me.roles.includes('admin')) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <CabinetPageHeader title="Topshiriqlar" />
        <BecomeInstructorButton />
      </div>
    );
  }

  const allSubmissions = await getInstructorSubmissions();
  const q = searchParams.q?.trim().toLowerCase();
  const submissions = q
    ? allSubmissions.filter(
        (s) =>
          s.student_name.toLowerCase().includes(q) ||
          s.course_title.toLowerCase().includes(q) ||
          s.assignment_title.toLowerCase().includes(q),
      )
    : allSubmissions;

  const pending = submissions.filter((s) => s.status === 'submitted');
  const graded = submissions.filter((s) => s.status !== 'submitted');
  const byTab: Record<TabKey, InstructorSubmissionItem[]> = {
    pending,
    graded,
    all: submissions,
  };
  const activeTab: TabKey =
    searchParams.tab === 'graded' || searchParams.tab === 'all' ? searchParams.tab : 'pending';
  const visible = byTab[activeTab];
  const pendingTotal = allSubmissions.filter((s) => s.status === 'submitted').length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <CabinetPageHeader
          title="Topshiriqlar navbati"
          subtitle={
            pendingTotal > 0
              ? `${pendingTotal} ta topshiriq tekshirilishi kerak`
              : "Tekshirish kerak bo'lgan topshiriq yo'q"
          }
        />
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
          <form
            method="GET"
            className="flex h-11 w-full items-center gap-2 rounded-full border border-line bg-paper px-4 focus-within:outline-none focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2 focus-within:ring-offset-paper sm:w-64"
          >
            {activeTab !== 'pending' && <input type="hidden" name="tab" value={activeTab} />}
            <SearchIcon width={18} height={18} className="shrink-0 text-ink-soft" />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ''}
              placeholder="O'quvchi yoki kurs"
              aria-label="O'quvchi yoki kurs bo'yicha qidirish"
              className="w-full bg-transparent font-sans text-sm text-ink placeholder:text-ink-soft focus:outline-none"
            />
          </form>
          <Link href="/ustoz/kurslar#yangi-kurs" className={buttonVariants({ size: 'md' })}>
            Yangi kurs
          </Link>
        </div>
      </div>

      <nav
        aria-label="Topshiriqlar toifalari"
        className="mt-2 flex w-full gap-1 overflow-x-auto rounded-full bg-surface-2 p-1 [contain:layout] sm:inline-flex sm:w-auto"
      >
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const search = new URLSearchParams();
          if (t.key !== 'pending') search.set('tab', t.key);
          if (q) search.set('q', q);
          const href = `/ustoz/kurslar/topshiriqlar${search.toString() ? `?${search.toString()}` : ''}`;
          return (
            <Link
              key={t.key}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-touch shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 font-sans text-sm font-semibold',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                active ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 font-mono text-xs',
                  active ? 'bg-white/15 text-white' : 'bg-paper text-ink-soft',
                )}
              >
                {byTab[t.key].length}
              </span>
            </Link>
          );
        })}
      </nav>

      {visible.length > 0 ? (
        <SubmissionsQueueManager
          items={visible.map((s) => ({
            ...s,
            submittedLabel: formatRelativeTime(s.created_at),
            overdue:
              s.status === 'submitted' &&
              Date.now() - new Date(s.created_at).getTime() > OVERDUE_AFTER_MS,
          }))}
        />
      ) : (
        <div className="imk-empty mt-4">
          <span className="imk-empty__icon" aria-hidden="true">
            <ClipboardIcon width={22} height={22} />
          </span>
          {q ? (
            <>
              <p className="font-sans text-base font-medium text-ink">Qidiruv bo'yicha topilmadi</p>
              <p className="max-w-sm font-sans text-sm text-ink-soft">Boshqa nom bilan qidirib ko'ring.</p>
            </>
          ) : activeTab === 'pending' ? (
            <>
              <p className="font-sans text-base font-medium text-ink">Tekshirish kerak bo'lgani yo'q</p>
              <p className="max-w-sm font-sans text-sm text-ink-soft">
                O'quvchilar yangi topshiriq yuborganda shu yerda ko'rinadi.
              </p>
            </>
          ) : (
            <>
              <p className="font-sans text-base font-medium text-ink">Bu toifada topshiriq yo'q</p>
              <p className="max-w-sm font-sans text-sm text-ink-soft">Boshqa toifani tanlab ko'ring.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
