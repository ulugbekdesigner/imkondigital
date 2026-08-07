import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';
import { RevealGroup, RevealItem } from '@/components/reveal';
import { ArrowLeftIcon, AlertIcon, ChevronRightIcon, HeartIcon, UsersIcon } from '@/components/shell-icons';
import { getActiveDonationProjectsResult } from '@/lib/donation-api';

export const metadata: Metadata = {
  title: "Ochiq Xayriya",
  description:
    "Ro'yxatdan o'tmasdan, 30 soniyada — IMKON tavsiya qilgan jonli loyihalarga hissa qo'shing. Har tushgan so'm hisoblanadi va natijasi ko'rinadi.",
  alternates: { canonical: '/xayriya' },
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Faol',
  funded: 'Moliyalashtirildi',
  completed: 'Yakunlandi',
};

export default async function DonationProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const showingCompleted = searchParams.status === 'completed';
  const result = await getActiveDonationProjectsResult(showingCompleted ? 'completed' : undefined);
  const projects = result.ok ? result.projects : [];

  return (
    <LandingSection tone="brand" ariaLabelledby="xayriya-title">
      <CursorGlow tone="dark" />
      <Ornament variant="arch-legs" className="top-0" />
      <Ornament variant="arch-crown" className="bottom-0" />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <span
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]"
          style={{ color: 'var(--land-teal-200)' }}
        >
          <HeartIcon width={16} height={16} aria-hidden="true" />
          Ochiq Xayriya
        </span>
        <h1
          id="xayriya-title"
          className="m-0 text-3xl font-bold tracking-[-0.03em] text-white md:text-5xl"
        >
          {showingCompleted ? 'Yakunlangan loyihalar' : "Kichik hissa — katta o'zgarish"}
        </h1>
        <p className="m-0 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>
          {showingCompleted
            ? "Har biri natija hisoboti bilan — yig'ilgan mablag' qayerga sarflangani ko'rinadi."
            : "Login shart emas. Summani tanlang, to'lang — har so'm loyiha balansiga tushadi va natijasi shu yerda ko'rinadi."}
        </p>
      </div>

      <div className="relative mt-8 flex items-center justify-center">
        {showingCompleted ? (
          <Link
            href="/xayriya"
            className="inline-flex min-h-touch items-center gap-1.5 rounded-full px-3 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            style={{ color: 'var(--land-teal-200)' }}
          >
            <ArrowLeftIcon width={16} height={16} aria-hidden="true" />
            Faol loyihalar
          </Link>
        ) : (
          <Link
            href="/xayriya?status=completed"
            className="inline-flex min-h-touch items-center gap-1.5 rounded-full px-3 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            style={{ color: 'var(--land-teal-200)' }}
          >
            Yakunlanganlar
            <ChevronRightIcon width={16} height={16} aria-hidden="true" />
          </Link>
        )}
      </div>

      {!result.ok ? (
        <div
          className="imk-error relative mx-auto mt-12 max-w-lg"
          style={{ background: 'var(--land-surface-onlight)', color: 'var(--land-text-on-light)' }}
        >
          <span className="imk-error__icon" aria-hidden="true">
            <AlertIcon width={24} height={24} />
          </span>
          <div>
            <h2 className="m-0 text-lg font-bold">Loyihalar yuklanmadi</h2>
            <p className="m-0 mt-1 text-sm" style={{ color: 'var(--land-text-on-light-muted)' }}>
              Server bilan bog&apos;lanishda xatolik yuz berdi. Internet aloqangizni tekshirib,
              qaytadan urinib ko&apos;ring.
            </p>
          </div>
          <Link
            href="/xayriya"
            className="imk-btn imk-btn--outline-onlight min-h-touch mt-1 justify-center"
          >
            Qayta urinish
          </Link>
        </div>
      ) : projects.length > 0 ? (
        <RevealGroup
          as="ul"
          className="relative mt-8 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((p) => (
            <RevealItem key={p.id} as="li">
              <Link
                href={`/xayriya/${p.id}`}
                className="imk-card block h-full no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`imk-chip ${p.status === 'active' ? 'imk-chip--active' : ''}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: 'var(--land-text-on-dark-dim)' }}
                  >
                    <UsersIcon width={15} height={15} aria-hidden="true" />
                    {p.donors_count} homiy
                  </span>
                </div>

                <h2 className="imk-card__title">{p.title}</h2>
                <p className="imk-card__body line-clamp-2">{p.story}</p>

                <div className="mt-auto flex flex-col gap-2.5">
                  <div
                    role="progressbar"
                    aria-valuenow={p.progress_pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${p.title} — ${p.progress_pct}% yig'ildi`}
                    className="imk-progress"
                  >
                    <i style={{ width: `${p.progress_pct}%` }} />
                  </div>
                  <div
                    className="flex items-center justify-between font-mono text-xs"
                    style={{ color: 'var(--land-text-on-dark-dim)' }}
                  >
                    <span className="font-semibold text-white">
                      {p.collected_amount.toLocaleString('uz-UZ')} so&apos;m
                    </span>
                    <span>{p.target_amount.toLocaleString('uz-UZ')} so&apos;m maqsad</span>
                  </div>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      ) : (
        <div
          className="imk-empty relative mx-auto mt-12 max-w-lg"
          style={{ background: 'var(--land-surface-onlight)', color: 'var(--land-text-on-light)' }}
        >
          <span className="imk-empty__icon" aria-hidden="true">
            <HeartIcon width={26} height={26} />
          </span>
          <h2 className="m-0 text-lg font-bold">
            {showingCompleted ? 'Hozircha yakunlangan loyiha yo’q' : "Hozircha faol loyiha yo'q"}
          </h2>
          <p className="m-0 text-base" style={{ color: 'var(--land-text-on-light-muted)' }}>
            {showingCompleted
              ? "Loyiha yakunlanib, hisobot chiqishi bilan shu yerda ko'rinadi."
              : "Yangi xayriya loyihalari chiqishi bilan shu yerda ko'rinadi."}
          </p>
          <Link href="/" className="imk-btn imk-btn--outline-onlight min-h-touch">
            Bosh sahifaga qaytish
          </Link>
        </div>
      )}
    </LandingSection>
  );
}
