import type { Metadata } from 'next';
import Link from 'next/link';
import { getMe } from '@/lib/server-api';
import { getMySubscription, getSubscriptionPricing } from '@/lib/subscription-api';
import { LandingSection, CursorGlow } from '@/components/landing/primitives';
import { LandingEffects } from '@/components/landing/landing-effects';
import { CheckIcon, InfoIcon, ChevronRightIcon } from '@/components/shell-icons';
import { formatThousands, formatDate } from '@/lib/format';
import { SubscriptionCheckoutButtons } from '@/components/subscription-checkout-buttons';

export const metadata: Metadata = {
  title: 'Tariflar',
  description:
    "IMKON Digital'da asosiy yo'l har doim bepul qoladi. PLUS va PRO daraja kengaytirilgan AI imkoniyatlarini beradi.",
  alternates: { canonical: '/tariflar' },
};

const BEPUL_FEATURES = [
  'Barcha kurslar, portfolio va sertifikatlar',
  'Vakansiyalarga cheklovsiz ariza',
  'Karyera maslahatchisi — kuniga 20 xabar',
  'CV yaratish — kuniga 3 marta',
  'Suhbat mashqi — kuniga 10 marta',
  'ZIYO AI yordamchi — kuniga 30 xabar',
];

const PLUS_FEATURES = [
  'Bepuldagi hamma narsa',
  'ZIYO AI yordamchi — kuniga 80 xabar',
  'Ziyo bilan til amaliyoti rejimi (ovozli)',
  'Mentor bilan oyiga 1 individual sessiya',
];

const PRO_FEATURES = [
  'PLUS dagi hamma narsa',
  'ZIYO AI yordamchi — kuniga 300 xabar',
  'Interview Coach va Career Coach kengaytirilgan kvota',
  'Doimiy individual mentor',
  'Portfolio PRO (video-hikoya)',
];

export default async function TariflarPage() {
  const [me, pricing, subscription] = await Promise.all([
    getMe(),
    getSubscriptionPricing(),
    getMySubscription(),
  ]);
  const myPlan = subscription?.plan ?? 'free';

  return (
    <>
      <LandingEffects />
      <LandingSection tone="light" ariaLabelledby="land-tariflar-title">
        <CursorGlow tone="light" />
        <div className="relative mb-10 flex flex-wrap items-end justify-between gap-10">
          <h1
            id="land-tariflar-title"
            className="max-w-[13em] text-3xl font-bold leading-[1.1] tracking-[-0.03em] md:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Tariflar —{' '}
            <span
              style={{
                fontFamily: 'var(--land-font-accent)',
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--land-brand-500)',
              }}
            >
              taklif
            </span>
          </h1>
          <p
            className="max-w-[26em] text-lg leading-relaxed"
            style={{ color: 'var(--land-text-on-light-muted)', textWrap: 'pretty' }}
          >
            <strong>Asosiy yo&apos;l har doim bepul qoladi</strong>: hech kim pul yo&apos;qligi
            uchun kasbdan mahrum bo&apos;lmaydi. PLUS/PRO — instrumentlarni kengaytiradi, asosiy
            yo&apos;lni cheklamaydi.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Bepul */}
          <div
            className="imk-card"
            style={{
              background: 'var(--land-surface-onlight)',
              color: 'var(--land-text-on-light)',
              border: '1px solid var(--land-line-light)',
            }}
          >
            <span
              className="text-xs font-bold uppercase tracking-[0.08em]"
              style={{ color: 'var(--land-text-on-light-dim)' }}
            >
              Asosiy
            </span>
            <span className="text-2xl font-bold" style={{ color: 'var(--land-text-on-light)' }}>
              Bepul
            </span>
            <ul className="mt-1 flex flex-col gap-2.5">
              {BEPUL_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm"
                  style={{ color: 'var(--land-text-on-light-muted)' }}
                >
                  <CheckIcon style={{ color: 'var(--land-brand-500)', flexShrink: 0, marginTop: '2px' }} />
                  {f}
                </li>
              ))}
            </ul>
            {myPlan === 'free' && me ? (
              <span
                className="mt-auto inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold"
                style={{ background: 'var(--land-brand-100)', color: 'var(--land-brand-700)' }}
              >
                Joriy tarifingiz
              </span>
            ) : (
              <Link href="/royxatdan-otish" className="imk-btn imk-btn--primary mt-auto justify-center">
                Bepul boshlash
              </Link>
            )}
          </div>

          {/* Plus */}
          <div
            className="imk-card"
            style={{
              background: 'var(--land-surface-onlight)',
              color: 'var(--land-text-on-light)',
              border: '1px solid var(--land-line-light)',
            }}
          >
            <span
              className="text-xs font-bold uppercase tracking-[0.08em]"
              style={{ color: 'var(--land-brand-500)' }}
            >
              Plus
            </span>
            <span className="text-2xl font-bold" style={{ color: 'var(--land-text-on-light)' }}>
              {formatThousands(pricing.plus_price_som)} so&apos;m<span className="text-base font-normal">/oy</span>
            </span>
            <ul className="mt-1 flex flex-col gap-2.5">
              {PLUS_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm"
                  style={{ color: 'var(--land-text-on-light-muted)' }}
                >
                  <CheckIcon style={{ color: 'var(--land-brand-500)', flexShrink: 0, marginTop: '2px' }} />
                  {f}
                </li>
              ))}
            </ul>
            {myPlan === 'plus' ? (
              <span
                className="mt-auto inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold"
                style={{ background: 'var(--land-brand-100)', color: 'var(--land-brand-700)' }}
              >
                Joriy tarifingiz{subscription?.granted_by === 'stipend' ? ' (stipendiya)' : ''}
                {subscription?.granted_by === 'purchase' && subscription.expires_at
                  ? ` — ${formatDate(subscription.expires_at)}gacha`
                  : ''}
              </span>
            ) : me ? (
              <SubscriptionCheckoutButtons
                plan="plus"
                className="mt-auto"
                primaryStyle={{ background: 'var(--land-brand-500)', color: 'var(--land-text-on-dark)' }}
              />
            ) : (
              <Link
                href="/royxatdan-otish"
                className="mt-auto inline-flex min-h-touch items-center justify-center rounded-full text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                style={{ border: '1px solid var(--land-line-light)', color: 'var(--land-brand-700)' }}
              >
                Ro&apos;yxatdan o&apos;tib faollashtirish
              </Link>
            )}
          </div>

          {/* Pro */}
          <div className="imk-card">
            <span
              className="text-xs font-bold uppercase tracking-[0.08em]"
              style={{ color: 'var(--land-teal-300)' }}
            >
              Pro
            </span>
            <span className="text-2xl font-bold text-white">
              {formatThousands(pricing.pro_price_som)} so&apos;m<span className="text-base font-normal">/oy</span>
            </span>
            <ul className="mt-1 flex flex-col gap-2.5">
              {PRO_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm"
                  style={{ color: 'var(--land-text-on-dark-muted)' }}
                >
                  <CheckIcon style={{ color: 'var(--land-teal-300)', flexShrink: 0, marginTop: '2px' }} />
                  {f}
                </li>
              ))}
            </ul>
            {myPlan === 'pro' ? (
              <span
                className="mt-auto inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold"
                style={{ background: 'var(--land-brand-500)', color: 'var(--land-text-on-dark)' }}
              >
                Joriy tarifingiz
                {subscription?.granted_by === 'purchase' && subscription.expires_at
                  ? ` — ${formatDate(subscription.expires_at)}gacha`
                  : ''}
              </span>
            ) : me ? (
              <SubscriptionCheckoutButtons
                plan="pro"
                className="mt-auto text-white"
                primaryStyle={{ background: 'var(--land-brand-500)', color: 'var(--land-text-on-dark)' }}
              />
            ) : (
              <Link
                href="/royxatdan-otish"
                className="mt-auto inline-flex min-h-touch items-center justify-center rounded-full text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--land-text-on-dark)' }}
              >
                Ro&apos;yxatdan o&apos;tib faollashtirish
              </Link>
            )}
          </div>
        </div>

        <div
          className="relative mt-8 flex items-start gap-3 rounded-2xl p-4"
          style={{ background: 'var(--land-brand-100)' }}
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--land-brand-500)', color: 'var(--land-text-on-dark)' }}
          >
            <InfoIcon width={18} height={18} />
          </span>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--land-brand-700)' }}>
            <strong>Nogironligi bor tasdiqlangan foydalanuvchilar uchun</strong> PLUS darajasi
            donor fondi hisobidan avtomatik ochiladi — profilingiz moderator tomonidan
            tasdiqlangach, hech qanday to&apos;lovsiz. PLUS/PRO — Payme yoki Click orqali oylik
            to&apos;lov bilan ham faollashtiriladi (30 kunlik muddat, tugashi yaqinlashganda
            bildirishnoma keladi).
          </p>
        </div>

        <div className="relative mt-4 flex items-start gap-2.5">
          <Link
            href="/xayriya"
            className="inline-flex min-h-touch items-center gap-1 rounded text-sm underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            style={{ color: 'var(--land-text-on-light-muted)' }}
          >
            Xayriya loyihalarini ko&apos;rish
            <ChevronRightIcon width={15} height={15} aria-hidden="true" />
          </Link>
        </div>
      </LandingSection>
    </>
  );
}
