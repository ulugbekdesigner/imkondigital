import type { Metadata } from 'next';
import Link from 'next/link';
import { getMe } from '@/lib/server-api';
import { getActivePrograms } from '@/lib/donor-api';
import { ApplyToProgramButton } from '@/components/apply-to-program-button';
import { LandingSection, CursorGlow } from '@/components/landing/primitives';
import { ClipboardIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Qo\'llab-quvvatlash dasturlari',
  description:
    "Donor tashkilotlarning faol dasturlari — tasdiqlangan nogironlik profili bilan ariza bering.",
};

export default async function ProgramsPage() {
  const [me, programs] = await Promise.all([getMe(), getActivePrograms()]);
  const canApply = me?.disability_verified_status === 'verified';

  return (
    <LandingSection tone="light" ariaLabelledby="land-programs-title">
      <CursorGlow tone="light" />
      <div className="relative mx-auto max-w-3xl">
        <h1
          id="land-programs-title"
          className="max-w-[13em] text-3xl font-bold leading-[1.1] tracking-[-0.03em] md:text-4xl"
          style={{ textWrap: 'balance' }}
        >
          Qo&apos;llab-quvvatlash{' '}
          <span
            style={{ fontFamily: 'var(--land-font-accent)', fontStyle: 'italic', fontWeight: 400, color: 'var(--land-brand-500)' }}
          >
            dasturlari
          </span>
        </h1>
        <p className="mt-3 max-w-[34em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-light-muted)', textWrap: 'pretty' }}>
          Donor tashkilotlar tomonidan e&apos;lon qilingan faol dasturlar. Ariza berish uchun
          tasdiqlangan nogironlik profili kerak.
        </p>

        {!me && (
          <p className="mt-4 text-sm" style={{ color: 'var(--land-text-on-light-dim)' }}>
            Ariza berish uchun avval{' '}
            <Link href="/kirish?next=/dasturlar" className="font-semibold underline" style={{ color: 'var(--land-brand-600)' }}>
              tizimga kiring
            </Link>
            .
          </p>
        )}
        {me && !canApply && (
          <p className="mt-4 text-sm" style={{ color: 'var(--land-text-on-light-dim)' }}>
            Ariza berish uchun{' '}
            <Link href="/profil" className="font-semibold underline" style={{ color: 'var(--land-brand-600)' }}>
              nogironlik profilingizni
            </Link>{' '}
            tasdiqlatishingiz kerak.
          </p>
        )}

        {programs.length > 0 ? (
          <ul className="relative mt-8 flex flex-col gap-4">
            {programs.map((p) => (
              <li
                key={p.id}
                className="imk-card"
                style={{ background: 'var(--land-surface-onlight)', color: 'var(--land-text-on-light)', border: '1px solid var(--land-line-light)' }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--land-text-on-light-dim)' }}>
                  {p.donor_name}
                </span>
                <h2 className="m-0 text-lg font-bold" style={{ color: 'var(--land-text-on-light)' }}>
                  {p.title}
                </h2>
                <p className="m-0 text-base leading-relaxed" style={{ color: 'var(--land-text-on-light-muted)' }}>
                  {p.description}
                </p>
                <p className="m-0 text-sm" style={{ color: 'var(--land-text-on-light-dim)' }}>
                  {p.enrolled_count} kishi qatnashmoqda
                </p>
                {canApply && (
                  <div className="mt-1">
                    <ApplyToProgramButton programId={p.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="relative mt-10 flex flex-col items-center gap-3 rounded-2xl border py-14 text-center" style={{ borderColor: 'var(--land-line-light)' }}>
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: 'rgba(63,114,207,0.1)', color: 'var(--land-brand-500)' }}
            >
              <ClipboardIcon />
            </span>
            <p className="m-0 text-base font-semibold" style={{ color: 'var(--land-text-on-light)' }}>
              Hozircha faol dastur yo&apos;q
            </p>
            <p className="m-0 max-w-[26em] text-sm" style={{ color: 'var(--land-text-on-light-muted)' }}>
              Donor tashkilotlar yangi dastur e&apos;lon qilishi bilan shu yerda ko&apos;rinadi.
            </p>
          </div>
        )}
      </div>
    </LandingSection>
  );
}
