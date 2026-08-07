import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { LandingSection, CursorGlow } from '@/components/landing/primitives';
import { CreateBenefitForm } from '@/components/create-benefit-form';
import { ArrowLeftIcon, LockIcon, PlusIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Yangi imtiyoz',
  robots: { index: false },
};

export default async function NewBenefitPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/imtiyozlar/yangi');
  const isModerator = me.roles.includes('moderator') || me.roles.includes('admin');

  if (!isModerator) {
    return (
      <LandingSection tone="light" ariaLabelledby="yangi-imtiyoz-locked-title">
        <CursorGlow tone="light" />
        <div className="relative mx-auto max-w-xl">
          <Link
            href="/imtiyozlar"
            className="inline-flex min-h-touch w-fit items-center gap-1.5 rounded font-sans text-base no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            style={{ color: 'var(--land-text-on-light-dim)' }}
          >
            <ArrowLeftIcon width={18} height={18} aria-hidden="true" />
            Imtiyozlarga qaytish
          </Link>
          <div
            className="imk-locked mt-6"
            style={{ background: 'var(--land-surface-onlight)', color: 'var(--land-text-on-light)' }}
          >
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text">
              <LockIcon width={20} height={20} />
            </span>
            <div>
              <h1
                id="yangi-imtiyoz-locked-title"
                className="m-0 font-sans text-base font-bold"
                style={{ color: 'var(--land-text-on-light)' }}
              >
                Bu bo'lim rolingizga ochiq emas
              </h1>
              <p className="m-0 mt-1 font-sans text-sm" style={{ color: 'var(--land-text-on-light-muted)' }}>
                Imtiyoz qo'shish faqat moderator va administratorlarga ochiq.
              </p>
            </div>
          </div>
        </div>
      </LandingSection>
    );
  }

  return (
    <LandingSection tone="light" ariaLabelledby="yangi-imtiyoz-title">
      <CursorGlow tone="light" />
      <div className="relative mx-auto max-w-xl">
        <Link
          href="/imtiyozlar"
          className="inline-flex min-h-touch w-fit items-center gap-1.5 rounded font-sans text-base no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          style={{ color: 'var(--land-text-on-light-dim)' }}
        >
          <ArrowLeftIcon width={18} height={18} aria-hidden="true" />
          Imtiyozlarga qaytish
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'var(--land-brand-500)', color: 'var(--land-text-on-dark)' }}
          >
            <PlusIcon width={20} height={20} />
          </span>
          <h1
            id="yangi-imtiyoz-title"
            className="text-2xl font-bold tracking-[-0.02em]"
            style={{ color: 'var(--land-text-on-light)' }}
          >
            Yangi imtiyoz joylashtirish
          </h1>
        </div>
        <p className="mt-2 font-sans text-base" style={{ color: 'var(--land-text-on-light-muted)' }}>
          Chop etilgach, katalogda darhol ko'rinadi va mos foydalanuvchilarga birinchi bo'lib
          ko'rsatiladi.
        </p>
        <div className="mt-6">
          <CreateBenefitForm />
        </div>
      </div>
    </LandingSection>
  );
}
