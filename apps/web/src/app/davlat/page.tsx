import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Badge, GlassCard, Skeleton, buttonVariants, cn } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getGovOverview } from '@/lib/analytics-api';
import { StatBarList } from '@/components/stat-bar-list';
import { formatDate, formatThousands } from '@/lib/format';
import {
  AlertIcon,
  BookIcon,
  BriefcaseIcon,
  BuildingIcon,
  DownloadIcon,
  EyeIcon,
  RefreshIcon,
  ShieldIcon,
  UsersIcon,
  WalletIcon,
} from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Davlat dashboard',
  robots: { index: false },
};

function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-card border border-line bg-paper p-4">
      <p className="font-mono text-xl font-bold tabular-nums text-ink">{value}</p>
      <p className="mt-1 font-sans text-xs text-ink-soft">{label}</p>
    </div>
  );
}

export default async function GovDashboardPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/davlat');
  if (!me.roles.includes('gov')) redirect('/profil');

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <header className="relative bg-deep">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-deep-fg/10 text-deep-fg"
            >
              <BuildingIcon width={20} height={20} />
            </span>
            <h1 className="font-display text-xl font-bold text-deep-fg">
              Davlat paneli · kuzatuv
            </h1>
          </div>
          <Badge variant="neutral" className="bg-deep-fg/15 text-deep-fg">
            <EyeIcon width={14} height={14} />
            Faqat o&apos;qish
          </Badge>
        </div>
      </header>

      <div className="relative mx-auto max-w-3xl px-4 py-10">
        <p className="font-sans text-base text-ink-soft">
          Barcha ko&apos;rsatkichlar anonim agregat — shaxsiy ma&apos;lumot ko&apos;rsatilmaydi.
          Kichik guruhlar (3 kishidan kam) alohida bostiriladi.
        </p>

        <Suspense fallback={<GovOverviewSkeleton />}>
          <GovOverview />
        </Suspense>
      </div>
    </div>
  );
}

async function GovOverview() {
  const overview = await getGovOverview();
  const today = formatDate(new Date().toISOString());

  if (!overview) {
    return (
      <div className="imk-error mt-8 sm:flex-row sm:items-center sm:justify-between">
        <span className="imk-error__icon" aria-hidden="true">
          <AlertIcon />
        </span>
        <p className="font-sans text-base text-ink-soft">
          Ma&apos;lumotlarni yuklab bo&apos;lmadi. Birozdan so&apos;ng qayta urinib ko&apos;ring.
        </p>
        <Link href="/davlat" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <RefreshIcon width={16} height={16} aria-hidden="true" />
          Qayta urinish
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Platforma qamrovi</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile value={formatThousands(overview.total_students)} label="o'quvchi" />
          <StatTile
            value={formatThousands(overview.total_employed)}
            label="ishga joylashgan"
          />
          <StatTile value={formatThousands(overview.total_companies)} label="kompaniya" />
          <StatTile value={overview.region_coverage} label="viloyat qamrovi" />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          Natijalar <span className="font-sans text-sm font-normal text-ink-soft">— tasdiqlangan nogironlik profiliga ega foydalanuvchilar orasida</span>
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Tasdiqlangan profil',
              value: formatThousands(overview.total_verified_disability_profiles),
              Icon: UsersIcon,
            },
            {
              label: 'Bandlik darajasi',
              value: `${overview.employment_rate_pct}%`,
              Icon: BriefcaseIcon,
            },
            {
              label: 'Kursni tugatish darajasi',
              value: `${overview.course_completion_rate_pct}%`,
              Icon: BookIcon,
            },
            {
              label: "Marketplace aylanmasi (so'm)",
              value: formatThousands(overview.marketplace_volume_som),
              Icon: WalletIcon,
            },
            {
              label: 'Olingan imtiyoz',
              value: formatThousands(overview.benefit_claims),
              Icon: ShieldIcon,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-card border border-line bg-paper p-4">
              <s.Icon className="text-primary" />
              <p className="mt-2 font-mono text-xl font-bold tabular-nums text-ink">
                {s.value}
              </p>
              <p className="mt-1 font-sans text-xs text-ink-soft">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <GlassCard className="p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Hududlar bo&apos;yicha ishga joylashuv
          </h2>
          <div className="mt-4">
            <StatBarList items={overview.region_employment_breakdown} />
          </div>
          <div className="mt-4 flex flex-col items-start gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-sans text-sm text-ink-soft">
              Ma&apos;lumot {today} holatiga · shaxsiy ma&apos;lumotlar ko&apos;rsatilmaydi
            </p>
            <a
              href="/api/analytics/gov/overview/export"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
            >
              <DownloadIcon width={16} height={16} aria-hidden="true" />
              Hisobotni yuklab olish
            </a>
          </div>
        </GlassCard>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          Hududlar bo&apos;yicha tasdiqlangan profil
        </h2>
        <div className="mt-3">
          <StatBarList items={overview.region_breakdown} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          Nogironlik guruhi bo&apos;yicha
        </h2>
        <div className="mt-3">
          <StatBarList items={overview.disability_group_breakdown} />
        </div>
      </section>
    </>
  );
}

function GovOverviewSkeleton() {
  return (
    <>
      <span className="sr-only" role="status">
        Ko&apos;rsatkichlar yuklanmoqda…
      </span>
      <section aria-hidden="true" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-paper p-4">
            <Skeleton className="h-6 w-14" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
        ))}
      </section>
      <section aria-hidden="true" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-paper p-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="mt-3 h-6 w-14" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </section>
      <section aria-hidden="true" className="mt-8 rounded-card border border-line bg-paper p-5">
        <Skeleton className="h-5 w-56" />
        <div className="mt-4 flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
      </section>
    </>
  );
}
