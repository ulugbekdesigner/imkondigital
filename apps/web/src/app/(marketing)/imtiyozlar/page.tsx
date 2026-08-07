import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LandingSection, CursorGlow } from '@/components/landing/primitives';
import { BenefitCard } from '@/components/benefit-card';
import { BenefitProviderFilter } from '@/components/benefit-provider-filter';
import { getBenefitCatalog, getMySavedBenefits } from '@/lib/benefits-api';
import { getMe } from '@/lib/server-api';
import type { Me } from '@/lib/types';
import { AlertIcon, PlusIcon, RefreshIcon, ShieldIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Imtiyozlar Markazi',
  description:
    "Nogironligi bor insonlar va ish beruvchilar uchun davlat imtiyozlari — hudud va ehtiyojingizga qarab moslashtirilgan.",
  alternates: { canonical: '/imtiyozlar' },
};

export default async function BenefitsPage({
  searchParams,
}: {
  searchParams: { provider_type?: string };
}) {
  const providerType =
    searchParams.provider_type === 'davlat' || searchParams.provider_type === 'kompaniya'
      ? searchParams.provider_type
      : undefined;
  const me = await getMe();
  const isModerator = Boolean(me?.roles.includes('moderator') || me?.roles.includes('admin'));

  return (
    <LandingSection tone="light" ariaLabelledby="imtiyozlar-title">
      <CursorGlow tone="light" />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-2xl flex-col gap-3">
            <span
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ color: 'var(--land-brand-600)' }}
            >
              <ShieldIcon width={16} height={16} aria-hidden="true" />
              Imtiyozlar Markazi
            </span>
            <h1
              id="imtiyozlar-title"
              className="m-0 text-3xl font-bold tracking-[-0.03em] md:text-4xl"
              style={{ color: 'var(--land-text-on-light)', textWrap: 'balance' }}
            >
              Sizga{' '}
              <span
                style={{
                  fontFamily: 'var(--land-font-accent)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'var(--land-brand-500)',
                }}
              >
                tegishli
              </span>{' '}
              imtiyozlar
            </h1>
            <p
              className="m-0 max-w-xl text-lg leading-relaxed"
              style={{ color: 'var(--land-text-on-light-muted)', textWrap: 'pretty' }}
            >
              Davlat va mahalliy dasturlar — hududingiz va nogironlik toifangizga mos imtiyozlar
              yuqorida ko'rsatiladi.
            </p>
          </div>
          {isModerator && (
            <Link href="/imtiyozlar/yangi" className="imk-btn imk-btn--primary">
              <PlusIcon width={16} height={16} aria-hidden="true" />
              Imtiyoz qo'shish
            </Link>
          )}
        </div>

        <div className="relative mt-8 flex flex-wrap items-center justify-between gap-4">
          <BenefitProviderFilter active={providerType} />
        </div>

        <Suspense key={providerType ?? 'all'} fallback={<BenefitsSkeleton />}>
          <BenefitsResults providerType={providerType} me={me} />
        </Suspense>
      </div>
    </LandingSection>
  );
}

async function BenefitsResults({
  providerType,
  me,
}: {
  providerType: 'davlat' | 'kompaniya' | undefined;
  me: Me | null;
}) {
  const [catalog, saved] = await Promise.all([
    getBenefitCatalog({ providerType }),
    me ? getMySavedBenefits() : Promise.resolve([]),
  ]);

  if (catalog === null) {
    return (
      <div
        className="imk-error relative mx-auto mt-10 max-w-lg"
        style={{
          alignItems: 'center',
          textAlign: 'center',
          background: 'var(--land-surface-onlight)',
          color: 'var(--land-text-on-light)',
        }}
      >
        <span aria-hidden="true" className="imk-error__icon mx-auto">
          <AlertIcon width={22} height={22} />
        </span>
        <h2 className="m-0 font-sans text-lg font-bold" style={{ color: 'var(--land-text-on-light)' }}>
          Imtiyozlarni yuklab bo'lmadi
        </h2>
        <p className="m-0 max-w-sm font-sans text-base" style={{ color: 'var(--land-text-on-light-muted)' }}>
          Server bilan bog'lanishda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring.
        </p>
        <Link
          href={providerType ? `/imtiyozlar?provider_type=${providerType}` : '/imtiyozlar'}
          className="imk-btn imk-btn--ghost mx-auto mt-2 inline-flex items-center gap-1.5"
          style={{
            background: 'rgba(16,26,51,0.06)',
            color: 'var(--land-text-on-light)',
            border: '1px solid var(--land-line-light)',
          }}
        >
          <RefreshIcon width={16} height={16} aria-hidden="true" />
          Qayta urinish
        </Link>
      </div>
    );
  }

  const { items } = catalog;

  return (
    <>
      <p
        className="relative m-0 -mt-2 mb-4 font-mono text-sm"
        style={{ color: 'var(--land-text-on-light-dim)' }}
        aria-live="polite"
      >
        {items.length > 0 ? `${items.length} ta imtiyoz` : 'Imtiyozlar ro\'yxati'}
        {me && saved.length > 0 && ` · saqlangan ${saved.length} ta`}
      </p>

      {items.length > 0 ? (
        <ul className="relative grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <BenefitCard key={b.id} benefit={b} authed={Boolean(me)} />
          ))}
        </ul>
      ) : (
        <div
          className="imk-empty relative mx-auto max-w-lg"
          style={{
            alignItems: 'center',
            textAlign: 'center',
            background: 'var(--land-surface-onlight)',
            color: 'var(--land-text-on-light)',
            borderColor: 'var(--land-line-light)',
          }}
        >
          <span aria-hidden="true" className="imk-empty__icon mx-auto">
            <ShieldIcon width={22} height={22} />
          </span>
          <h2 className="m-0 font-sans text-lg font-bold" style={{ color: 'var(--land-text-on-light)' }}>
            {providerType ? "Bu toifada imtiyoz yo'q" : "Hozircha imtiyoz yo'q"}
          </h2>
          <p className="m-0 max-w-sm font-sans text-base" style={{ color: 'var(--land-text-on-light-muted)' }}>
            {providerType
              ? "Boshqa toifani tanlab ko'ring."
              : "Yangi dasturlar chiqishi bilan shu yerda ko'rinadi."}
          </p>
          <Link
            href={providerType ? '/imtiyozlar' : '/'}
            className="imk-btn imk-btn--ghost mx-auto mt-2"
            style={{
              background: 'rgba(16,26,51,0.06)',
              color: 'var(--land-text-on-light)',
              border: '1px solid var(--land-line-light)',
            }}
          >
            {providerType ? 'Barcha imtiyozlarni ko\'rish' : 'Bosh sahifaga qaytish'}
          </Link>
        </div>
      )}
    </>
  );
}

function BenefitsSkeleton() {
  return (
    <div className="relative">
      <span className="sr-only" role="status">
        Imtiyozlar yuklanmoqda…
      </span>
      <div aria-hidden="true" className="imk-skeleton mb-4 h-4 w-32" />
      <ul aria-hidden="true" className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="list-none">
            <div
              className="imk-card relative h-full"
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: '14px',
                background: 'var(--land-surface-onlight)',
                border: '1px solid var(--land-line-light)',
                padding: '18px 20px',
              }}
            >
              <div className="imk-skeleton h-11 w-11 shrink-0 rounded-2xl" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="imk-skeleton h-4 w-4/5" />
                <div className="imk-skeleton h-3 w-2/5" />
                <div className="imk-skeleton mt-1 h-5 w-1/3" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
