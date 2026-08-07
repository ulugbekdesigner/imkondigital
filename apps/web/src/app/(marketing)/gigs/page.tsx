import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { buttonVariants, Skeleton } from '@imkon/ui';
import { PageHeader } from '@/components/page-header';
import { GigCard } from '@/components/gig-card';
import { GigCategoryFilter } from '@/components/gig-category-filter';
import { getGigCatalog } from '@/lib/marketplace-api';
import { getAccessToken } from '@/lib/session';
import { GIG_CATEGORIES } from '@/lib/gig-categories';
import { BriefcaseIcon, SearchIcon } from '@/components/shell-icons';
import { EmptyState, ErrorState } from '@/components/state-panels';
import type { GigPage } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Freelancer xizmatlar',
  description: "IMKON Digital freelancerlaridan xizmat buyurtma qiling — himoyalangan to'lov bilan.",
  alternates: { canonical: '/gigs' },
};

export default function GigsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const q = searchParams.q;
  const category = (GIG_CATEGORIES as readonly string[]).includes(searchParams.category ?? '')
    ? searchParams.category
    : undefined;
  const authed = Boolean(getAccessToken());

  return (
    <>
      <PageHeader
        eyebrow="Freelancer Marketplace"
        title="Xizmatlarni tanlang"
        lead="Har bir to'lov himoyalangan holatda saqlanadi va ish qabul qilingandan keyingina freelancerga chiqariladi."
      />

      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
          <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
        </div>

        <section className="relative mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <form method="GET" role="search" className="flex min-h-touch gap-2">
              <label htmlFor="q" className="sr-only">
                Qidirish
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-soft"
                >
                  <SearchIcon width={16} height={16} />
                </span>
                <input
                  id="q"
                  name="q"
                  type="search"
                  defaultValue={q ?? ''}
                  placeholder="Xizmat qidirish…"
                  className="min-h-touch w-64 rounded border border-line bg-paper py-2 pl-9 pr-3 font-sans text-base text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                />
              </div>
              <button type="submit" className={buttonVariants({ variant: 'outline' })}>
                Qidirish
              </button>
            </form>
            {authed && (
              <Link href="/gigs/yangi" className={buttonVariants()}>
                Xizmat qo'shish
              </Link>
            )}
          </div>

          <div className="mt-4">
            <GigCategoryFilter active={category} q={q} />
          </div>

          <Suspense key={`${category}-${q}`} fallback={<GigsSkeleton />}>
            <GigResults q={q} category={category} authed={authed} />
          </Suspense>
        </section>
      </div>
    </>
  );
}

async function GigResults({
  q,
  category,
  authed,
}: {
  q: string | undefined;
  category: string | undefined;
  authed: boolean;
}) {
  let catalog: GigPage;
  try {
    catalog = await getGigCatalog({ q, category });
  } catch {
    return (
      <div className="mt-8">
        <ErrorState description="Xizmatlar katalogini yuklashda xatolik yuz berdi. Qayta urinib ko'ring." />
      </div>
    );
  }
  const items = catalog.items;
  const filtered = Boolean(q || category);

  if (items.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={<BriefcaseIcon width={24} height={24} aria-hidden="true" />}
          title={filtered ? "Bu bo'yicha xizmat topilmadi" : "Katalog hozircha to'lmagan"}
          description={
            filtered
              ? 'Boshqa kategoriya yoki so‘rov bilan qidirib ko‘ring.'
              : "Bu — halol bo'sh holat: soxta e'lon ko'rsatilmaydi. Freelancer sifatida birinchi xizmatingizni joylashtiring — mijozlar sizni shu yerdan topadi."
          }
          action={
            <div className="flex flex-wrap gap-3">
              {authed ? (
                <Link href="/gigs/yangi" className={buttonVariants()}>
                  Xizmat qo'shish
                </Link>
              ) : (
                <Link href="/royxatdan-otish" className={buttonVariants()}>
                  Ro'yxatdan o'tish
                </Link>
              )}
              {filtered && (
                <Link href="/gigs" className={buttonVariants({ variant: 'outline' })}>
                  Barcha xizmatlarni ko'rish
                </Link>
              )}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <>
      <p className="mt-6 font-sans text-sm text-ink-soft" aria-live="polite">
        {items.length} ta xizmat topildi
      </p>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <GigCard key={g.id} gig={g} />
        ))}
      </ul>
    </>
  );
}

function GigsSkeleton() {
  return (
    <>
      <span className="sr-only" role="status">
        Xizmatlar yuklanmoqda…
      </span>
      <div className="mt-6">
        <Skeleton className="h-4 w-32" />
      </div>
      <ul aria-hidden="true" className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-lg border border-line bg-paper p-5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="mt-2 h-5 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </li>
        ))}
      </ul>
    </>
  );
}
