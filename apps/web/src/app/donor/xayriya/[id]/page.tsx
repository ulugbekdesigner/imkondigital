import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Badge, Card, GlassCard, ProgressBar, Skeleton, buttonVariants, cn } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getMyDonationProjectsResult, getProjectDonationsResult } from '@/lib/donation-api';
import { DonationFundedCelebration } from '@/components/donation-funded-celebration';
import { DonationProjectStatusControl } from '@/components/donation-project-status-control';
import { DonationReportForm } from '@/components/donation-report-form';
import { AlertIcon, ArrowLeftIcon, HeartIcon, RefreshIcon, UsersIcon } from '@/components/shell-icons';
import { formatDate, formatThousands } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Xayriya loyihasi — Donor',
  robots: { index: false },
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Qoralama',
  active: 'Faol',
  funded: 'Moliyalashtirildi',
  completed: 'Yakunlangan',
};

export default async function DonorDonationProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getMe();
  if (!me) redirect(`/kirish?next=/donor/xayriya/${params.id}`);
  if (!me.roles.includes('donor') && !me.roles.includes('admin')) redirect('/profil');

  const projectId = Number(params.id);
  const projectsResult = await getMyDonationProjectsResult();

  if (!projectsResult.ok) {
    return (
      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/donor"
          className="min-h-touch text-ink-soft hover:text-primary focus-visible:ring-focus inline-flex items-center gap-2 rounded font-sans text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <ArrowLeftIcon width={16} height={16} />
          Dasturlarim
        </Link>
        <div className="imk-error mt-6">
          <span className="imk-error__icon" aria-hidden="true">
            <AlertIcon />
          </span>
          <p className="font-sans text-base text-ink-soft">
            Loyiha ma&apos;lumotini yuklab bo&apos;lmadi. Server bilan bog&apos;lanishda muammo
            yuz berdi.
          </p>
          <Link
            href={`/donor/xayriya/${projectId}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <RefreshIcon width={16} height={16} aria-hidden="true" />
            Qayta urinish
          </Link>
        </div>
      </div>
    );
  }

  const project = projectsResult.projects.find((p) => p.id === projectId);
  if (!project) notFound();

  return (
    <div className="relative overflow-hidden">
      <DonationFundedCelebration
        projectId={project.id}
        projectTitle={project.title}
        status={project.status}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="bg-bright/15 absolute -right-24 top-0 h-72 w-72 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/donor"
          className="min-h-touch text-ink-soft hover:text-primary focus-visible:ring-focus inline-flex items-center gap-2 rounded font-sans text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <ArrowLeftIcon width={16} height={16} />
          Dasturlarim
        </Link>

        <div
          className="mt-4 overflow-hidden rounded-card p-6"
          style={{
            background:
              'linear-gradient(118deg, rgb(var(--imkon-deep)) 0%, rgb(var(--imkon-bright)) 55%, rgb(var(--imkon-teal)) 100%)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
              >
                <HeartIcon width={18} height={18} />
              </span>
              <h1 className="font-display text-xl font-bold text-white">{project.title}</h1>
            </div>
            <span className="text-deep inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 font-sans text-xs font-semibold">
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-mono text-3xl font-bold tabular-nums text-white">
              {formatThousands(project.collected_amount)}
            </span>
            <span className="font-sans text-sm text-white/80">
              {formatThousands(project.target_amount)} so&apos;mdan
            </span>
          </div>

          <div className="mt-3.5">
            <ProgressBar
              surface="dark"
              value={project.progress_pct}
              label={`${project.title} — ${project.progress_pct}% yig'ildi`}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {(project.status === 'funded' || project.status === 'completed') && (
              <Link
                href="#hisobot"
                className={cn(buttonVariants({ size: 'md' }), 'bg-white text-deep hover:brightness-95')}
              >
                Hisobot yozish
              </Link>
            )}
            <DonationProjectStatusControl
              projectId={project.id}
              status={project.status}
              className="h-11 border-2 border-white/50 px-5 text-white hover:bg-white/10"
            />
          </div>
        </div>

        <p className="text-ink-soft mt-5 font-sans text-base">{project.story}</p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="border-line bg-paper rounded-card border p-4">
            <p className="text-ink font-mono text-lg font-bold tabular-nums">
              {formatThousands(project.collected_amount)}
            </p>
            <p className="text-ink-soft font-sans text-xs">Yig&apos;ildi (so&apos;m)</p>
          </div>
          <div className="border-line bg-paper rounded-card border p-4">
            <p className="text-ink font-mono text-lg font-bold tabular-nums">
              {formatThousands(project.target_amount)}
            </p>
            <p className="text-ink-soft font-sans text-xs">Maqsad (so&apos;m)</p>
          </div>
          <div className="border-line bg-paper rounded-card border p-4">
            <p className="text-ink font-mono text-lg font-bold tabular-nums">
              {project.donors_count}
            </p>
            <p className="text-ink-soft font-sans text-xs">Homiy</p>
          </div>
        </div>

        {project.deadline && (
          <p className="text-ink-soft mt-3 font-sans text-xs">
            Muddat: {formatDate(project.deadline)}
          </p>
        )}

        <Suspense fallback={<DonationsSkeleton />}>
          <DonationsSection projectId={project.id} />
        </Suspense>

        {(project.status === 'funded' || project.status === 'completed') && (
          <section id="hisobot" className="mt-8 scroll-mt-6">
            <GlassCard className="p-6">
              <h2 className="font-display text-ink text-lg font-semibold">Shaffoflik hisoboti</h2>
              <p className="text-ink-soft mt-1 font-sans text-sm">
                Yig&apos;ilgan mablag&apos; qayerga sarflanganini homiylarga ko&apos;rsating.
              </p>
              <div className="mt-3">
                <DonationReportForm projectId={project.id} initialReport={project.report} />
              </div>
            </GlassCard>
          </section>
        )}
      </div>
    </div>
  );
}

async function DonationsSection({ projectId }: { projectId: number }) {
  const result = await getProjectDonationsResult(projectId);

  return (
    <section className="mt-8">
      <GlassCard className="p-6">
        <div className="flex items-center gap-2">
          <UsersIcon className="text-primary" />
          <h2 className="font-display text-ink text-lg font-semibold">
            Homiylar {result.ok ? `(${result.donations.length})` : ''}
          </h2>
        </div>
        {result.ok ? (
          result.donations.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {result.donations.map((d) => (
                <li key={d.id}>
                  <Card className="flex items-center justify-between p-4">
                    <span className="text-ink font-sans text-base">
                      {d.is_anonymous ? 'Anonim homiy' : (d.donor_name ?? 'Nomsiz homiy')}
                    </span>
                    <Badge variant="primary">{formatThousands(d.amount)} so&apos;m</Badge>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <div className="imk-empty mt-3">
              <span className="imk-empty__icon" aria-hidden="true">
                <UsersIcon />
              </span>
              <p className="text-ink-soft font-sans text-base">Hali to&apos;langan hissa yo&apos;q.</p>
            </div>
          )
        ) : (
          <div className="imk-error mt-3">
            <span className="imk-error__icon" aria-hidden="true">
              <AlertIcon />
            </span>
            <p className="text-ink-soft font-sans text-base">Homiylar ro&apos;yxatini yuklab bo&apos;lmadi.</p>
            <Link
              href={`/donor/xayriya/${projectId}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <RefreshIcon width={16} height={16} aria-hidden="true" />
              Qayta urinish
            </Link>
          </div>
        )}
      </GlassCard>
    </section>
  );
}

function DonationsSkeleton() {
  return (
    <section className="mt-8">
      <span className="sr-only" role="status">
        Homiylar yuklanmoqda…
      </span>
      <div aria-hidden="true" className="rounded-card border border-line bg-paper p-6">
        <Skeleton className="h-5 w-28" />
        <div className="mt-3 flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-line p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
