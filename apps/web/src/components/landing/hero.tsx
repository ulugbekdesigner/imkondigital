import Link from 'next/link';
import type { SuccessStoryOut } from '@/lib/success-stories-api';
import { LandingSection, CursorGlow, Ornament } from './primitives';
import { DigitalLadderPanel } from './digital-ladder-panel';
import { ZiyoMascot } from './ziyo-mascot';
import { OpenZiyoLink } from './open-ziyo-link';

export function LandingHero({
  stories,
  courseCount,
  vacancyCount,
}: {
  stories: SuccessStoryOut[];
  courseCount: number;
  vacancyCount: number;
}) {
  return (
    <LandingSection tone="dark" ariaLabelledby="land-hero-title" className="!pt-32">
      <CursorGlow tone="dark" />
      <Ornament variant="star" className="-right-24 -top-24" />
      <Ornament variant="lattice" />
      <div data-depth={1} className="imk-blob -left-24 -top-24 h-96 w-96" style={{ background: 'var(--land-blob-brand)' }} aria-hidden="true" />
      <div data-depth={2} className="imk-blob -right-16 top-24 h-80 w-80" style={{ background: 'var(--land-blob-teal)' }} aria-hidden="true" />

      <div className="relative mx-auto grid grid-cols-1 max-w-6xl gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="flex flex-col items-start gap-6">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest"
            style={{ borderColor: 'var(--land-line-dark-strong)', color: 'var(--land-text-on-dark-muted)' }}
          >
            Inklyuziv raqamli karyera platformasi
          </span>

          <h1
            id="land-hero-title"
            className="max-w-[10em] text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-white md:text-6xl"
            style={{ textWrap: 'balance' }}
          >
            IMKON — AI bilan kasbga, kasbdan{' '}
            <span style={{ fontFamily: 'var(--land-font-accent)', fontStyle: 'italic', fontWeight: 400, color: 'var(--land-teal-300)' }}>
              ishga
            </span>
          </h1>

          <p className="max-w-[26em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-dark-muted)' }}>
            Nogironligi bor insonlar uchun kurslar, portfolio va tekshirilgan vakansiyalar — bittasi
            ikkinchisiga olib boradi.{' '}
            <span className="font-semibold text-white">
              Interfeys sizga moslashadi — siz interfeysga emas.
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/vakansiyalar" className="imk-btn imk-btn--ghost">
              Ochiq vakansiyalar
            </Link>
            <Link href="/royxatdan-otish" className="imk-btn imk-btn--primary text-base">
              Bepul boshlash
            </Link>
          </div>

          <p className="font-mono text-sm" style={{ color: 'var(--land-text-on-dark-dim)' }}>
            {courseCount} kurs · {vacancyCount} faol vakansiya · bugun boshlash mumkin
          </p>

          <OpenZiyoLink className="mt-2 flex items-center gap-3.5 rounded-2xl border px-3 py-2.5 text-left" style={{ borderColor: 'var(--land-line-dark)' }}>
            <ZiyoMascot size={48} />
            <span className="text-sm" style={{ color: 'var(--land-text-on-dark)' }}>
              Salom! Men <strong>ZIYO</strong> — kerak bo&apos;lsa, shu yerdaman.
            </span>
          </OpenZiyoLink>
        </div>

        <DigitalLadderPanel stories={stories} />
      </div>
    </LandingSection>
  );
}
