import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Badge, CardHeader, CardTitle, GlassCard, ProgressBar, Skeleton, buttonVariants } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getDonorOverview, getMyProgramsResult } from '@/lib/donor-api';
import { getMyDonationProjectsResult } from '@/lib/donation-api';
import { formatThousands } from '@/lib/format';
import { CreateProgramForm } from '@/components/create-program-form';
import { ProgramStatusControl } from '@/components/program-status-control';
import { CreateDonationProjectForm } from '@/components/create-donation-project-form';
import { DonationProjectStatusControl } from '@/components/donation-project-status-control';
import { StatBarList } from '@/components/stat-bar-list';
import {
  AlertIcon,
  BookIcon,
  BriefcaseIcon,
  CheckIcon,
  ClipboardIcon,
  HeartIcon,
  PlusIcon,
  RefreshIcon,
  UsersIcon,
} from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Donor kabineti',
  robots: { index: false },
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Qoralama',
  active: 'Faol',
  completed: 'Yakunlangan',
};

const STATUS_BADGE: Record<string, 'neutral' | 'success' | 'info'> = {
  draft: 'neutral',
  active: 'success',
  completed: 'info',
};

const DONATION_STATUS_LABEL: Record<string, string> = {
  draft: 'Qoralama',
  active: 'Faol',
  funded: 'Moliyalashtirildi',
  completed: 'Yakunlangan',
};

const DONATION_STATUS_BADGE: Record<string, 'neutral' | 'success' | 'info'> = {
  draft: 'neutral',
  active: 'success',
  funded: 'info',
  completed: 'neutral',
};

export default async function DonorPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/donor');
  if (!me.roles.includes('donor')) redirect('/profil');

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <header className="relative bg-deep">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-6">
          <h1 className="font-display text-xl font-bold text-deep-fg">Donor kabineti</h1>
          <span className="inline-flex items-center rounded-full bg-gold px-3 py-1.5 font-sans text-xs font-semibold text-gold-fg">
            Donor
          </span>
        </div>
      </header>

      <div className="relative mx-auto max-w-3xl px-4 py-10">
        <p className="font-sans text-base text-ink-soft">
          Qo&apos;llab-quvvatlash dasturlarini yarating va ta&apos;sirini anonim agregat
          ko&apos;rsatkichlar orqali kuzating.
        </p>

        <Suspense fallback={<DonorOverviewSkeleton />}>
          <DonorOverview />
        </Suspense>
      </div>
    </div>
  );
}

async function DonorOverview() {
  const [programsResult, overview, donationProjectsResult] = await Promise.all([
    getMyProgramsResult(),
    getDonorOverview(),
    getMyDonationProjectsResult(),
  ]);

  return (
    <>
      {overview ? (
        <>
          <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Dasturlar', value: overview.programs_count, Icon: ClipboardIcon },
              { label: 'Arizalar', value: overview.total_applicants, Icon: UsersIcon },
              { label: 'Qabul qilingan', value: overview.approved_enrollees, Icon: CheckIcon },
              {
                label: 'Kursni tugatgan',
                value: overview.completed_courses_among_enrollees,
                Icon: BookIcon,
              },
              {
                label: 'Ishga joylashgan',
                value: overview.placements_among_enrollees,
                Icon: BriefcaseIcon,
              },
            ].map((s) => (
              <div key={s.label} className="rounded-card border border-line bg-paper p-4">
                <s.Icon className="text-primary" />
                <p className="mt-2 font-mono text-xl font-bold tabular-nums text-ink">
                  {formatThousands(s.value)}
                </p>
                <p className="mt-1 font-sans text-xs text-ink-soft">{s.label}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Hudud bo&apos;yicha</h2>
              <div className="mt-3">
                <StatBarList items={overview.region_breakdown} />
              </div>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Toifa bo&apos;yicha</h2>
              <div className="mt-3">
                <StatBarList items={overview.disability_group_breakdown} />
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="imk-error mt-8">
          <span className="imk-error__icon" aria-hidden="true">
            <AlertIcon />
          </span>
          <p className="font-sans text-base text-ink-soft">
            Ko&apos;rsatkichlarni hozircha yuklab bo&apos;lmadi. Server bilan bog&apos;lanishda
            muammo yuz berdi.
          </p>
          <Link
            href="/donor"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <RefreshIcon width={16} height={16} aria-hidden="true" />
            Qayta urinish
          </Link>
        </div>
      )}

      <section className="mt-10">
        <GlassCard className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardIcon className="text-primary" />
              Dasturlarim
            </CardTitle>
          </CardHeader>
          {programsResult.ok ? (
            programsResult.programs.length > 0 ? (
              <ul className="flex flex-col divide-y divide-line">
                {programsResult.programs.map((p) => (
                  <li key={p.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/donor/${p.id}`}
                        className="inline-flex min-h-touch items-center rounded font-display text-base font-semibold text-ink hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                      >
                        {p.title}
                      </Link>
                      <Badge variant={STATUS_BADGE[p.status] ?? 'neutral'}>
                        {p.status === 'completed' && <CheckIcon width={12} height={12} />}
                        {STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                    </div>
                    <p className="mt-1 font-sans text-sm text-ink-soft">
                      {p.enrolled_count} qabul qilingan ishtirokchi
                    </p>
                    <div className="mt-3">
                      <ProgramStatusControl programId={p.id} status={p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="imk-empty">
                <span className="imk-empty__icon" aria-hidden="true">
                  <ClipboardIcon />
                </span>
                <div>
                  <p className="font-sans text-base font-semibold text-ink">Hali dastur yo&apos;q</p>
                  <p className="mt-1 font-sans text-sm text-ink-soft">
                    Pastdagi shakl orqali birinchi qo&apos;llab-quvvatlash dasturingizni yarating.
                  </p>
                </div>
                <Link href="#yangi-dastur" className={buttonVariants({ variant: 'outline' })}>
                  Dastur yaratish
                </Link>
              </div>
            )
          ) : (
            <div className="imk-error">
              <span className="imk-error__icon" aria-hidden="true">
                <AlertIcon />
              </span>
              <p className="font-sans text-base text-ink-soft">
                Dasturlar ro&apos;yxatini yuklab bo&apos;lmadi.
              </p>
              <Link href="/donor" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <RefreshIcon width={16} height={16} aria-hidden="true" />
                Qayta urinish
              </Link>
            </div>
          )}
        </GlassCard>
      </section>

      <section className="mt-8">
        <GlassCard className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartIcon className="text-primary" />
              Ochiq Xayriya loyihalarim
            </CardTitle>
          </CardHeader>
          {donationProjectsResult.ok ? (
            donationProjectsResult.projects.length > 0 ? (
              <ul className="flex flex-col divide-y divide-line">
                {donationProjectsResult.projects.map((p) => (
                  <li key={p.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/donor/xayriya/${p.id}`}
                        className="inline-flex min-h-touch items-center rounded font-display text-base font-semibold text-ink hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                      >
                        {p.title}
                      </Link>
                      <Badge variant={DONATION_STATUS_BADGE[p.status] ?? 'neutral'}>
                        {DONATION_STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <ProgressBar
                        value={p.progress_pct}
                        label={`${p.title} — ${p.progress_pct}% yig'ildi`}
                      />
                    </div>
                    <p className="mt-2 font-mono text-xs text-ink-soft">
                      {p.collected_amount.toLocaleString('uz-UZ')} /{' '}
                      {p.target_amount.toLocaleString('uz-UZ')} so&apos;m · {p.donors_count} homiy
                    </p>
                    <div className="mt-3">
                      <DonationProjectStatusControl projectId={p.id} status={p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="imk-empty">
                <span className="imk-empty__icon" aria-hidden="true">
                  <HeartIcon />
                </span>
                <div>
                  <p className="font-sans text-base font-semibold text-ink">
                    Hali xayriya loyihasi yo&apos;q
                  </p>
                  <p className="mt-1 font-sans text-sm text-ink-soft">
                    Pastdagi shakl orqali ochiq xayriya loyihasini qo&apos;shing.
                  </p>
                </div>
                <Link href="#yangi-loyiha" className={buttonVariants({ variant: 'outline' })}>
                  Loyiha qo&apos;shish
                </Link>
              </div>
            )
          ) : (
            <div className="imk-error">
              <span className="imk-error__icon" aria-hidden="true">
                <AlertIcon />
              </span>
              <p className="font-sans text-base text-ink-soft">
                Xayriya loyihalarini yuklab bo&apos;lmadi.
              </p>
              <Link href="/donor" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <RefreshIcon width={16} height={16} aria-hidden="true" />
                Qayta urinish
              </Link>
            </div>
          )}
          <div id="yangi-loyiha" className="mt-6 scroll-mt-6 border-t border-line pt-5">
            <p className="mb-2 font-sans text-sm font-semibold text-ink-soft">
              Yangi loyiha qo&apos;shish
            </p>
            <CreateDonationProjectForm />
          </div>
        </GlassCard>
      </section>

      <section id="yangi-dastur" className="mt-8 scroll-mt-6">
        <GlassCard className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="text-primary" />
              Yangi dastur
            </CardTitle>
          </CardHeader>
          <CreateProgramForm />
        </GlassCard>
      </section>
    </>
  );
}

function DonorOverviewSkeleton() {
  return (
    <>
      <span className="sr-only" role="status">
        Ko&apos;rsatkichlar yuklanmoqda…
      </span>
      <section aria-hidden="true" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-paper p-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="mt-3 h-6 w-14" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </section>
      <section aria-hidden="true" className="mt-10 rounded-card border border-line bg-paper p-6">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 border-t border-line pt-4 first:border-0 first:pt-0">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
