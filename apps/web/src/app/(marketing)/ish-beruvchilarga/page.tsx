import type { Metadata } from 'next';
import Link from 'next/link';
import { CountUp } from '@imkon/ui';
import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';
import { getEmployerPublicStats, getVerifiedCompanies } from '@/lib/employer-api';
import { UsersIcon, BriefcaseIcon, VideoIcon, ShieldIcon, CheckIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Ish beruvchilarga',
  description:
    'Tasdiqlangan ko‘nikmali, sinovdan o‘tgan nomzodlar. Kvotani bajarish, moslashuv maslahati va davlat imtiyozlari — bitta oynada.',
  alternates: { canonical: '/ish-beruvchilarga' },
};

const OFFERS = [
  {
    title: 'Tayyor nomzodlar bazasi',
    desc: 'Skills Passport bo‘yicha qidiruv: ko‘nikma, hudud, ish formati. Tasdiqlangan portfolio va kurs natijalari bilan.',
    icon: UsersIcon,
  },
  {
    title: 'Kvotadan qiymatgacha',
    desc: 'Nogironligi bor xodim — “majburiyat” emas, malakali kadr. Moslashuv va davlat imtiyozlari bo‘yicha yo‘riqnoma.',
    icon: BriefcaseIcon,
  },
  {
    title: 'Masofaviy jamoa',
    desc: 'Junior mutaxassislar remote ishlashga tayyor. Transport va bino to‘sig‘i muammo emas.',
    icon: VideoIcon,
  },
  {
    title: '3 oy kafolat',
    desc: 'Muvaffaqiyatli joylashtirishdan keyin kuzatuv. 3 oy ichida ketib qolsa — keyingi nomzodni bepul topamiz.',
    icon: ShieldIcon,
  },
];

export default async function EmployersPage() {
  const [verifiedCompanies, publicStats] = await Promise.all([
    getVerifiedCompanies(),
    getEmployerPublicStats(),
  ]);

  const stats = [
    { label: "e'lon joylash", value: '0 so‘m' },
    publicStats?.avg_days_to_hire !== null && publicStats?.avg_days_to_hire !== undefined
      ? { label: "o'rtacha yollash", value: `${publicStats.avg_days_to_hire} kun` }
      : null,
    publicStats?.retention_3m_pct !== null && publicStats?.retention_3m_pct !== undefined
      ? { label: '3 oydan keyin ishda', value: `${publicStats.retention_3m_pct}%` }
      : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  return (
    <>
      <LandingSection tone="dark" ariaLabelledby="land-employers-title">
        <CursorGlow tone="dark" />
        <Ornament variant="lattice" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-6">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest"
            style={{ borderColor: 'var(--land-line-dark-strong)', color: 'var(--land-text-on-dark-muted)' }}
          >
            Ish beruvchilarga
          </span>
          <h1
            id="land-employers-title"
            className="max-w-[15em] text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white md:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Tayyor nomzodlar —{' '}
            <span
              style={{ fontFamily: 'var(--land-font-accent)', fontStyle: 'italic', fontWeight: 400, color: 'var(--land-teal-300)' }}
            >
              ko'nikmasi tekshirilgan
            </span>
            , sharoiti aniq
          </h1>
          <p className="max-w-[30em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-dark-muted)', textWrap: 'pretty' }}>
            Har bir nomzodning portfoliosi, sertifikati va kerakli moslashtirilgan sharoitlari
            oldindan ko‘rinadi — suhbatga tayyorgarlik vaqtingizni tejaydi.
          </p>

          {stats.length > 0 && (
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col gap-1 rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}
                >
                  <span className="font-mono text-xl font-bold tabular-nums text-white sm:text-2xl">
                    {s.value}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--land-text-on-dark-muted)' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/ish-beruvchi" className="imk-btn imk-btn--primary">
              Kompaniya ochish
            </Link>
            <a href="#qanday-ishlaydi" className="imk-btn imk-btn--ghost">
              Qanday ishlaydi
            </a>
          </div>

          <p className="font-mono text-sm" style={{ color: 'var(--land-text-on-dark-dim)' }}>
            <CountUp value={verifiedCompanies.length} /> tasdiqlangan kompaniya · 3 oy kuzatuv
            kafolati bilan
          </p>
        </div>
      </LandingSection>

      <LandingSection tone="light" ariaLabelledby="qanday-ishlaydi">
        <CursorGlow tone="light" />
        <h2 id="qanday-ishlaydi" className="sr-only" style={{ scrollMarginTop: '96px' }}>
          Qanday ishlaydi
        </h2>
        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
          {OFFERS.map((o) => (
            <div key={o.title} className="imk-card">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'rgba(111,179,207,0.16)', color: 'var(--land-teal-300)' }}
              >
                <o.icon />
              </span>
              <h3 className="imk-card__title">{o.title}</h3>
              <p className="imk-card__body">{o.desc}</p>
            </div>
          ))}
        </div>

        {verifiedCompanies.length > 0 && (
          <div className="relative mt-14">
            <h2 className="text-xl font-bold" style={{ color: 'var(--land-text-on-light)' }}>
              “Inklyuziv Ish Beruvchi” hamkorlarimiz
            </h2>
            <p className="mt-2 max-w-2xl text-base" style={{ color: 'var(--land-text-on-light-muted)' }}>
              Hujjat va aloqasi tekshirilgan, tasdiqlangan kompaniyalar — vakansiyalarida ishonch
              belgisi bilan ko‘rinadi.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {verifiedCompanies.map((c) => (
                <li
                  key={c.id}
                  className="imk-card"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '16px 18px' }}
                >
                  <span
                    role="img"
                    title="Tasdiqlangan ish beruvchi"
                    aria-label="Tasdiqlangan ish beruvchi"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'var(--land-brand-500)' }}
                  >
                    <CheckIcon style={{ color: 'var(--land-text-on-dark)' }} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-white">{c.name}</span>
                    {c.employee_count !== null && (
                      <span className="block text-xs" style={{ color: 'var(--land-text-on-dark-dim)' }}>
                        {c.employee_count} xodim
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </LandingSection>

      <LandingSection tone="brand" ariaLabelledby="land-anchor-title" className="pb-24 pt-20">
        <CursorGlow tone="dark" />
        <Ornament variant="arch-legs" className="top-0" />
        <Ornament variant="arch-crown" className="bottom-0" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <h2 id="land-anchor-title" className="m-0 text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
            Anchor hamkor bo‘ling
          </h2>
          <p className="m-0 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.94)' }}>
            Birinchi hamkorlar uchun kafolatlangan amaliyot o‘rinlari va “Inklyuziv Ish
            Beruvchi” belgisi. Jamoangiz uchun mos nomzodlarni birga topamiz.
          </p>
          <Link href="/aloqa" className="imk-btn" style={{ background: 'var(--land-surface-onlight)', color: 'var(--navy-900)' }}>
            Bog‘lanish
          </Link>
        </div>
      </LandingSection>
    </>
  );
}
