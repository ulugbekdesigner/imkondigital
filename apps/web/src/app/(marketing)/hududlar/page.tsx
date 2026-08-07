import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { GlassCard, Skeleton, cn } from '@imkon/ui';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState } from '@/components/state-panels';
import { getRegionsWithStats } from '@/lib/regions-api';
import { getMe } from '@/lib/server-api';
import { formatThousands } from '@/lib/format';
import type { Me } from '@/lib/types';
import { BuildingIcon, ChevronRightIcon, ShieldIcon, UsersIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Hududlar',
  description: "IMKON Digital O'zbekiston bo'ylab qaysi hududlarda faol — vakansiya va imtiyozlar statistikasi.",
  alternates: { canonical: '/hududlar' },
};

export default async function RegionsPage() {
  const me = await getMe();

  return (
    <>
      <PageHeader
        eyebrow="Hududlar"
        title="Butun O'zbekiston bo'ylab"
        lead="Har hududda nechta odam ishga joylashgani, ochiq vakansiya va imtiyoz borligini ko'ring — o'z viloyatingizni tanlang."
      />

      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
          <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-12">
          <Suspense fallback={<RegionsSkeleton />}>
            <RegionsResults me={me} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function RegionsResults({ me }: { me: Me | null }) {
  const regions = await getRegionsWithStats();

  if (regions === null) {
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState
          title="Hududlarni yuklab bo'lmadi"
          description="Server bilan bog'lanishda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring."
        />
      </div>
    );
  }

  return (
    <>
      {regions.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {regions.map((r) => {
                const isMine = me != null && r.id === me.region_id;
                return (
                  <li key={r.id}>
                    <Link
                      href={`/hududlar/${r.slug}`}
                      className={cn(
                        'block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                        isMine && 'relative overflow-hidden bg-deep',
                      )}
                    >
                      {isMine && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal/30 blur-3xl"
                        />
                      )}
                      <GlassCard
                        hover
                        surface={isMine ? 'on-dark' : 'on-light'}
                        className="relative flex h-full flex-col gap-4 p-5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <h2
                              className={cn(
                                'font-display text-lg font-semibold',
                                isMine ? 'text-deep-fg' : 'text-ink',
                              )}
                            >
                              {r.name}
                            </h2>
                            {isMine && (
                              <span className="font-sans text-xs font-semibold text-teal">
                                Sizning hududingiz
                              </span>
                            )}
                          </div>
                          <ChevronRightIcon
                            className={cn('shrink-0', isMine ? 'text-mist' : 'text-ink-soft')}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <span
                            className={cn(
                              'font-mono text-3xl font-bold tabular-nums',
                              isMine ? 'text-deep-fg' : 'text-ink',
                            )}
                          >
                            {formatThousands(r.stats.placed_count)}
                          </span>
                          <span
                            className={cn('font-sans text-sm', isMine ? 'text-mist' : 'text-ink-soft')}
                          >
                            ishga joylashgan · {formatThousands(r.stats.open_vacancies)} vakansiya
                          </span>
                        </div>

                        <dl
                          className={cn(
                            'flex flex-col gap-2 border-t pt-3',
                            isMine ? 'border-deep-fg/10' : 'border-line',
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <dt
                              className={cn(
                                'flex items-center gap-1.5 font-sans text-sm',
                                isMine ? 'text-mist' : 'text-ink-soft',
                              )}
                            >
                              <ShieldIcon width={15} height={15} aria-hidden="true" />
                              Imtiyozlar
                            </dt>
                            <dd
                              className={cn(
                                'font-mono text-sm font-semibold',
                                isMine ? 'text-deep-fg' : 'text-ink',
                              )}
                            >
                              {formatThousands(r.stats.published_benefits)}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <dt
                              className={cn(
                                'flex items-center gap-1.5 font-sans text-sm',
                                isMine ? 'text-mist' : 'text-ink-soft',
                              )}
                            >
                              <UsersIcon width={15} height={15} aria-hidden="true" />
                              O'quvchi
                            </dt>
                            <dd
                              className={cn(
                                'font-mono text-sm font-semibold',
                                isMine ? 'text-deep-fg' : 'text-ink',
                              )}
                            >
                              {formatThousands(r.stats.registered_users)}
                            </dd>
                          </div>
                        </dl>
                      </GlassCard>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mx-auto max-w-lg">
              <EmptyState
                icon={<BuildingIcon width={22} height={22} aria-hidden="true" />}
                title="Hududlar hali yuklanmadi"
                description="Ma'lumotlar tez orada bu yerda ko'rinadi."
              />
            </div>
          )}
    </>
  );
}

function RegionsSkeleton() {
  return (
    <>
      <span className="sr-only" role="status">
        Hududlar yuklanmoqda…
      </span>
      <ul aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-paper p-5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <div className="flex flex-col gap-2 border-t border-line pt-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
