import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { buttonVariants, cn, Skeleton } from '@imkon/ui';
import { StepFilter } from '@/components/step-filter';
import { PriceFilter } from '@/components/price-filter';
import { CourseRegionFilter } from '@/components/course-region-filter';
import { CourseCard } from '@/components/course-card';
import { CourseCategoryGrid } from '@/components/course-category-grid';
import { BookIcon, RouteIcon, SearchIcon, SparkIcon } from '@/components/shell-icons';
import { getCatalog } from '@/lib/courses-api';
import { getRegions } from '@/lib/regions-api';

export const metadata: Metadata = {
  title: 'Kurslar',
  description:
    'Hunardan IT gacha — raqamli narvonning har pog‘onasi uchun kurslar. Video darslik, subtitr va amaliy topshiriqlar bilan.',
  alternates: { canonical: '/kurslar' },
};

const DEFAULT_LIMIT = 8;
const LIMIT_STEP = 8;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { step?: string; is_free?: string; q?: string; limit?: string; region_id?: string };
}) {
  const step =
    searchParams.step !== undefined && /^[0-4]$/.test(searchParams.step)
      ? Number(searchParams.step)
      : undefined;
  const isFree =
    searchParams.is_free === 'true' ? true : searchParams.is_free === 'false' ? false : undefined;
  const q = searchParams.q?.trim() || undefined;
  const regionId =
    searchParams.region_id !== undefined && /^\d+$/.test(searchParams.region_id)
      ? Number(searchParams.region_id)
      : undefined;
  const limit = Math.max(DEFAULT_LIMIT, Number(searchParams.limit) || DEFAULT_LIMIT);
  const hasFilters = step !== undefined || isFree !== undefined || !!q || regionId !== undefined;
  const regions = await getRegions();

  const moreHref = (extra: Record<string, string>) => {
    const search = new URLSearchParams();
    if (step !== undefined) search.set('step', String(step));
    if (isFree !== undefined) search.set('is_free', String(isFree));
    if (q) search.set('q', q);
    if (regionId !== undefined) search.set('region_id', String(regionId));
    for (const [k, v] of Object.entries(extra)) search.set(k, v);
    return `/kurslar?${search.toString()}`;
  };

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Kurslar katalogi</h1>
            <p className="font-sans text-base text-ink-soft">
              Barchasi subtitr, transkript va klaviatura boshqaruvi bilan
            </p>
          </div>
          <form
            method="GET"
            className="flex h-12 w-full items-center gap-2.5 rounded-full border border-line bg-paper px-4 focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2 focus-within:ring-offset-paper sm:w-[380px]"
          >
            <SearchIcon width={20} height={20} className="shrink-0 text-ink-soft" />
            {step !== undefined && <input type="hidden" name="step" value={step} />}
            {isFree !== undefined && <input type="hidden" name="is_free" value={String(isFree)} />}
            <input
              type="search"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Kurs nomi yoki ko'nikma"
              aria-label="Kurs nomi yoki ko'nikma bo'yicha qidirish"
              className="w-full bg-transparent font-sans text-sm text-ink placeholder:text-ink-soft focus:outline-none"
            />
          </form>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border border-line bg-paper p-5">
          <StepFilter active={step} isFree={isFree} q={q} />
          <span className="hidden h-7 w-px bg-line sm:block" />
          <PriceFilter active={isFree} step={step} q={q} />
          <span className="hidden h-7 w-px bg-line sm:block" />
          <CourseRegionFilter
            regions={regions}
            active={regionId !== undefined ? String(regionId) : undefined}
            step={step}
            isFree={isFree}
            q={q}
          />
          {hasFilters && (
            <Link
              href="/kurslar"
              className="ml-auto inline-flex min-h-touch items-center gap-1.5 rounded font-sans text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              Filtrlarni tozalash
            </Link>
          )}
        </div>

        <Suspense key={`${step}-${isFree}-${q}-${regionId}-${limit}`} fallback={<CatalogSkeleton />}>
          <CourseResults
            step={step}
            isFree={isFree}
            q={q}
            regionId={regionId}
            limit={limit}
            moreHref={moreHref}
          />
        </Suspense>

        <section className="mt-14 rounded-2xl border border-line bg-paper p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-primary"
                aria-hidden="true"
              >
                <BookIcon />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold text-ink">Dars bera olasizmi?</h2>
                <p className="mt-1 font-sans text-base text-ink-soft">
                  Ustoz sifatida ro'yxatdan o'ting va bir daqiqada birinchi kursingizni yarating.
                </p>
              </div>
            </div>
            <Link href="/ustoz/kurslar" className={buttonVariants()}>
              Ustoz sifatida boshlash
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

async function CourseResults({
  step,
  isFree,
  q,
  regionId,
  limit,
  moreHref,
}: {
  step: number | undefined;
  isFree: boolean | undefined;
  q: string | undefined;
  regionId: number | undefined;
  limit: number;
  moreHref: (extra: Record<string, string>) => string;
}) {
  const { items, next_cursor } = await getCatalog({ step, isFree, q, regionId, limit });
  const hasFilters = step !== undefined || isFree !== undefined || !!q || regionId !== undefined;

  if (items.length === 0) {
    return (
      <div className="mt-8">
        <div className="imk-empty">
          <span aria-hidden="true" className="imk-empty__icon">
            <SparkIcon width={22} height={22} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-bold text-ink">
              {hasFilters ? "Bu filtr bo'yicha kurs topilmadi" : 'Kurslar tez orada ochiladi'}
            </h2>
            <p className="font-sans text-base text-ink-soft">
              Filtrni kengaytiring yoki ZIYO&apos;dan so&apos;rang — u sizga mos yo&apos;nalishni tanlab beradi.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {hasFilters && (
              <Link href="/kurslar" className={buttonVariants({ variant: 'outline' })}>
                Barcha kurslarni ko'rish
              </Link>
            )}
            <Link href="/karyera-kochi" className={buttonVariants()}>
              ZIYO&apos;dan so&apos;rash
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="font-display text-lg font-bold text-ink">Yo‘nalishlar</h2>
          <p className="mt-2 font-sans text-base text-ink-soft">
            Har bir yo‘nalishda kamida bitta bepul kurs — platforma standarti.
          </p>
          <div className="mt-6">
            <CourseCategoryGrid />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="mt-6 font-sans text-sm text-ink-soft" aria-live="polite">
        {items.length} ta kurs ko&apos;rsatildi
      </p>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
        <li className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 p-5" style={{ background: 'radial-gradient(320px 160px at 100% 0%, rgb(var(--imkon-teal) / 0.22), transparent 62%), linear-gradient(150deg, var(--surface-dark), var(--surface-dark-2))' }}>
          <div className="flex flex-col gap-2">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-teal">
              <RouteIcon width={18} height={18} />
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-wide text-mist">Narvon</span>
            <span className="font-sans text-base font-bold text-white">
              Qaysi pog'onadan boshlashni bilmayapsizmi?
            </span>
            <p className="font-sans text-sm leading-relaxed text-mist">
              3 daqiqalik test darajangizni aniqlaydi.
            </p>
          </div>
          <Link
            href="/daraja-testi"
            className={cn(buttonVariants({ size: 'md' }), 'bg-paper text-ink hover:brightness-95')}
          >
            Testni boshlash
          </Link>
        </li>
      </ul>

      {next_cursor !== null && (
        <div className="mt-8 flex items-center justify-center gap-3.5">
          <Link
            href={moreHref({ limit: String(limit + LIMIT_STEP) })}
            className={buttonVariants({ variant: 'outline', size: 'md' })}
          >
            Yana {LIMIT_STEP} ta kurs
          </Link>
          <span className="font-sans text-sm text-ink-soft">{items.length} tasi ko&apos;rsatildi</span>
        </div>
      )}
    </>
  );
}

function CatalogSkeleton() {
  return (
    <>
      <span className="sr-only" role="status">
        Kurslar yuklanmoqda…
      </span>
      <div className="mt-6">
        <Skeleton className="h-4 w-32" />
      </div>
      <ul aria-hidden="true" className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className={cn('flex flex-col overflow-hidden rounded-2xl border border-line bg-paper')}>
            <Skeleton className="h-[116px] w-full rounded-none" />
            <div className="flex flex-col gap-2 p-[18px]">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
