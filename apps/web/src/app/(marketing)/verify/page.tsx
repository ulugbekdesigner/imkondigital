import type { Metadata } from 'next';
import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';
import { SearchIcon } from '@/components/shell-icons';
import { VerifyLookup } from '@/components/verify-lookup';

export const metadata: Metadata = {
  title: 'Sertifikatni tekshirish',
  description:
    'IMKON Digital sertifikatining haqiqiyligini bir soniyada tekshiring — ID yoki QR-kod orqali.',
  alternates: { canonical: '/verify' },
};

export default function VerifyIndexPage() {
  return (
    <LandingSection tone="dark" ariaLabelledby="land-verify-title">
      <CursorGlow tone="dark" />
      <Ornament variant="medallion" className="-right-32 top-0" />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'var(--land-brand-500)', color: 'var(--land-text-on-dark)' }}
        >
          <SearchIcon />
        </span>
        <h1
          id="land-verify-title"
          className="max-w-[13em] text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white md:text-5xl"
          style={{ textWrap: 'balance' }}
        >
          Sertifikat haqiqiyligini{' '}
          <span
            style={{ fontFamily: 'var(--land-font-accent)', fontStyle: 'italic', fontWeight: 400, color: 'var(--land-teal-300)' }}
          >
            tekshiring
          </span>
        </h1>
        <p className="max-w-[30em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-dark-muted)', textWrap: 'pretty' }}>
          Har bir IMKON Digital sertifikati noyob ID va QR-kodga ega. ID ni kiriting yoki
          QR-kodni skaner qiling — natijani bir soniyada ko‘rasiz.
        </p>

        <div
          className="imk-card w-full text-left"
          style={{ background: 'var(--land-surface-onlight)', color: 'var(--land-text-on-light)', border: '1px solid var(--land-line-light)' }}
        >
          <VerifyLookup />
        </div>

        <p className="text-sm" style={{ color: 'var(--land-text-on-dark-dim)' }}>
          Ish beruvchimisiz? Nomzod sertifikatini shu yerda tasdiqlang — hujjat qalbaki
          emasligiga ishonch hosil qiling.
        </p>
      </div>
    </LandingSection>
  );
}
