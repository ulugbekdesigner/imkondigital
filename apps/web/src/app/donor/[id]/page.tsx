import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Badge, GlassCard, Skeleton, buttonVariants, cn } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getMyProgramsResult, getProgramApplicationsResult } from '@/lib/donor-api';
import { avatarGradient, initialsOf } from '@/lib/avatar';
import { ProgramApplicationDecisionButtons } from '@/components/program-application-decision-buttons';
import { AlertIcon, ArrowLeftIcon, ClipboardIcon, RefreshIcon, UsersIcon } from '@/components/shell-icons';
import { formatDate } from '@/lib/format';
import type { ProgramEnrollmentOut } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Dastur arizalari — Donor',
  robots: { index: false },
};

const PROGRAM_STATUS_LABEL: Record<string, string> = {
  draft: 'Qoralama',
  active: 'Faol',
  completed: 'Yakunlangan',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Kutilmoqda',
  approved: 'Qabul qilingan',
  rejected: 'Rad etilgan',
};

const STATUS_BADGE: Record<string, 'neutral' | 'success' | 'error'> = {
  pending: 'neutral',
  approved: 'success',
  rejected: 'error',
};

type TabKey = 'pending' | 'approved' | 'rejected';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending', label: 'Yangi' },
  { key: 'approved', label: 'Qabul' },
  { key: 'rejected', label: 'Rad' },
];

export default async function DonorProgramDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const me = await getMe();
  if (!me) redirect(`/kirish?next=/donor/${params.id}`);
  if (!me.roles.includes('donor')) redirect('/profil');

  const programId = Number(params.id);
  const programsResult = await getMyProgramsResult();

  if (!programsResult.ok) {
    return (
      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/donor"
          className="inline-flex min-h-touch items-center gap-2 rounded font-sans text-sm text-ink-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <ArrowLeftIcon width={16} height={16} />
          Dasturlarim
        </Link>
        <div className="imk-error mt-6">
          <span className="imk-error__icon" aria-hidden="true">
            <AlertIcon />
          </span>
          <p className="font-sans text-base text-ink-soft">
            Dastur ma&apos;lumotini yuklab bo&apos;lmadi. Server bilan bog&apos;lanishda muammo
            yuz berdi.
          </p>
          <Link href={`/donor/${programId}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <RefreshIcon width={16} height={16} aria-hidden="true" />
            Qayta urinish
          </Link>
        </div>
      </div>
    );
  }

  const program = programsResult.programs.find((p) => p.id === programId);
  if (!program) notFound();

  const activeTab: TabKey =
    searchParams.tab === 'approved' || searchParams.tab === 'rejected'
      ? searchParams.tab
      : 'pending';

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/donor"
          className="inline-flex min-h-touch items-center gap-2 rounded font-sans text-sm text-ink-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <ArrowLeftIcon width={16} height={16} />
          Dasturlarim
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-primary"
          >
            <ClipboardIcon />
          </span>
          <h1 className="font-display text-2xl font-bold text-ink">{program.title}</h1>
          <Badge variant={program.status === 'active' ? 'success' : 'neutral'}>
            {PROGRAM_STATUS_LABEL[program.status] ?? program.status}
          </Badge>
        </div>
        <p className="mt-2 font-sans text-base text-ink-soft">{program.description}</p>

        <Suspense fallback={<ApplicationsSkeleton />}>
          <ApplicationsSection programId={programId} activeTab={activeTab} />
        </Suspense>
      </div>
    </div>
  );
}

async function ApplicationsSection({
  programId,
  activeTab,
}: {
  programId: number;
  activeTab: TabKey;
}) {
  const result = await getProgramApplicationsResult(programId);

  if (!result.ok) {
    return (
      <section className="mt-8">
        <div className="imk-error">
          <span className="imk-error__icon" aria-hidden="true">
            <AlertIcon />
          </span>
          <p className="font-sans text-base text-ink-soft">Arizalarni yuklab bo&apos;lmadi.</p>
          <Link
            href={`/donor/${programId}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <RefreshIcon width={16} height={16} aria-hidden="true" />
            Qayta urinish
          </Link>
        </div>
      </section>
    );
  }

  const applications = result.applications;
  const byTab: Record<TabKey, ProgramEnrollmentOut[]> = {
    pending: applications.filter((a) => a.status === 'pending'),
    approved: applications.filter((a) => a.status === 'approved'),
    rejected: applications.filter((a) => a.status === 'rejected'),
  };
  const visible = byTab[activeTab];

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UsersIcon className="text-primary" />
          <h2 className="font-display text-lg font-semibold text-ink">
            Arizalar · {applications.length} ta
          </h2>
        </div>
        {applications.length > 0 && (
          <nav
            aria-label="Arizalar toifalari"
            className="flex w-full gap-1 overflow-x-auto rounded-full bg-surface-2 p-1 [contain:layout] sm:w-auto"
          >
            {TABS.map((t) => {
              const active = activeTab === t.key;
              const href =
                t.key === 'pending'
                  ? `/donor/${programId}`
                  : `/donor/${programId}?tab=${t.key}`;
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
        )}
      </div>

      {applications.length > 0 ? (
        <p className="mt-3 font-sans text-xs text-ink-soft">
          Barcha arizachilar tasdiqlangan nogironlik profiliga ega — bu dasturga ariza berish
          sharti.
        </p>
      ) : null}

      {visible.length > 0 ? (
        <GlassCard className="mt-4 overflow-hidden p-0">
          <ul className="divide-y divide-line">
            {visible.map((a) => {
              const details = [
                a.region_name,
                a.ladder_step > 0 ? `${a.ladder_step}-pog'ona` : null,
              ].filter((p): p is string => p !== null);
              return (
                <li
                  key={a.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      style={{ background: avatarGradient(a.user_id) }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-sans text-sm font-bold text-white"
                    >
                      {initialsOf(a.applicant_name)}
                    </span>
                    <div>
                      <p className="font-sans text-base font-bold text-ink">
                        {a.applicant_name}
                      </p>
                      <p className="font-sans text-xs text-ink-soft">
                        {details.length > 0 ? details.join(' · ') : formatDate(a.applied_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    {a.status === 'pending' ? (
                      <ProgramApplicationDecisionButtons
                        programId={programId}
                        enrollmentId={a.id}
                      />
                    ) : (
                      <Badge variant={STATUS_BADGE[a.status] ?? 'neutral'}>
                        {STATUS_LABEL[a.status] ?? a.status}
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      ) : (
        <div className="imk-empty mt-4">
          <span className="imk-empty__icon" aria-hidden="true">
            <UsersIcon />
          </span>
          <p className="font-sans text-base text-ink-soft">
            {applications.length === 0 ? "Hali ariza yo'q." : "Bu toifada ariza yo'q."}
          </p>
        </div>
      )}
    </section>
  );
}

function ApplicationsSkeleton() {
  return (
    <section className="mt-8">
      <span className="sr-only" role="status">
        Arizalar yuklanmoqda…
      </span>
      <div aria-hidden="true" className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div aria-hidden="true" className="mt-4 flex flex-col gap-4 rounded-[18px] border border-line bg-paper p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
