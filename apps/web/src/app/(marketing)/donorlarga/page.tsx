import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';
import { ChartIcon, DashboardIcon, ShieldIcon, ClipboardIcon } from '@/components/shell-icons';
import { getActiveDonationProjects } from '@/lib/donation-api';

export const metadata: Metadata = {
  title: 'Donorlarga',
  description:
    'Har bir so‘m real vaqtda kuzatiladi: nechta odam o‘qidi, nechta ishga joylashdi, qancha daromad qildi. Hisobot avtomatik, ma‘lumot tekshiriladigan.',
  alternates: { canonical: '/donorlarga' },
};

const POINTS = [
  {
    title: 'Faoliyat emas — natija',
    desc: '“500 kishi o‘qidi” emas, “340 kishi ishga joylashdi, o‘rtacha daromad 4,2 mln so‘m”. Har modul daromadga bog‘lanadi.',
    icon: ChartIcon,
  },
  {
    title: 'Real vaqt monitoring',
    desc: 'Byudjet sarfi, ro‘yxatdan o‘tganlar, kursni tugatganlar, daromadga chiqqanlar — jonli dashboardda.',
    icon: DashboardIcon,
  },
  {
    title: 'Tekshiriladigan ma‘lumot',
    desc: 'Sertifikat ID‘lari, anonimlashtirilgan trayektoriya ma‘lumotlari. “Ishonch, lekin tekshirib” printsipi.',
    icon: ShieldIcon,
  },
  {
    title: 'Istalgan vaqt hisobot',
    desc: 'Oylik/choraklik kutish shart emas — dastur natijasini istalgan kuni, real vaqtda dashboardda ko‘rasiz.',
    icon: ClipboardIcon,
  },
];

const STEPS = [
  { n: 1, text: 'Dastur maqsadini belgilaysiz' },
  { n: 2, text: 'Arizalarni ko‘rib chiqasiz (profil tasdiqlangan)' },
  { n: 3, text: 'Istalgan vaqtda real vaqtdagi natijani ko‘rasiz' },
];

export default async function DonorsPage() {
  const completedProjects = await getActiveDonationProjects('completed');
  const sampleReport = completedProjects.find((p) => p.report.trim().length > 0);
  const sampleReportHref = sampleReport ? `/xayriya/${sampleReport.id}` : '/xayriya?status=completed';

  return (
    <>
      <LandingSection tone="light" ariaLabelledby="land-donors-title">
        <CursorGlow tone="light" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-6">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest"
            style={{ borderColor: 'var(--land-line-light)', color: 'var(--land-text-on-light-dim)' }}
          >
            Donorlar va tashkilotlar
          </span>
          <h1
            id="land-donors-title"
            className="max-w-[13em] text-4xl font-bold leading-[1.08] tracking-[-0.03em] md:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Har bir so‘m —{' '}
            <span
              style={{ fontFamily: 'var(--land-font-accent)', fontStyle: 'italic', fontWeight: 400, color: 'var(--land-brand-500)' }}
            >
              ko‘rinadigan
            </span>{' '}
            natija
          </h1>
          <p className="max-w-[32em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-light-muted)', textWrap: 'pretty' }}>
            Grant natijasini kuzatishning yagona raqamli tizimi. Maqsadli guruh belgilang, KPI
            qo‘ying va real vaqtda impact‘ni kuzating.
          </p>

          <ol className="flex w-full max-w-[28em] flex-col gap-2.5 p-0">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="flex items-center gap-3 rounded-2xl border p-3.5"
                style={{ borderColor: 'var(--land-line-light)', background: 'var(--land-surface-onlight)' }}
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold text-white"
                  style={{ background: s.n === 3 ? 'var(--navy-900)' : 'var(--land-brand-500)' }}
                >
                  {s.n}
                </span>
                <span className="text-base" style={{ color: 'var(--land-text-on-light)' }}>{s.text}</span>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/aloqa" className="imk-btn imk-btn--primary">
              Dastur yaratish
            </Link>
            <Link href={sampleReportHref} className="imk-btn imk-btn--ghost" style={{ background: 'rgba(16,26,51,0.06)', color: 'var(--land-text-on-light)', border: '1px solid var(--land-line-light)' }}>
              Namuna hisobot
            </Link>
          </div>
        </div>
      </LandingSection>

      <LandingSection tone="dark" ariaLabelledby="land-donor-points-title">
        <CursorGlow tone="dark" />
        <h2 id="land-donor-points-title" className="sr-only">
          Nima uchun IMKON Digital orqali homiylik qilish
        </h2>
        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
          {POINTS.map((p) => (
            <div key={p.title} className="imk-card">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'rgba(111,179,207,0.16)', color: 'var(--land-teal-300)' }}
              >
                <p.icon />
              </span>
              <h3 className="imk-card__title">{p.title}</h3>
              <p className="imk-card__body">{p.desc}</p>
            </div>
          ))}
        </div>
      </LandingSection>

      <LandingSection tone="brand" ariaLabelledby="land-donor-cta-title" className="pb-24 pt-20">
        <CursorGlow tone="dark" />
        <Ornament variant="arch-legs" className="top-0" />
        <Ornament variant="arch-crown" className="bottom-0" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <h2 id="land-donor-cta-title" className="m-0 text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
            Dasturingizni birga quramiz
          </h2>
          <p className="m-0 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.94)' }}>
            Hudud, nogironlik toifasi va yosh bo‘yicha maqsadli dastur, o‘lchanadigan KPI va
            shaffof hisobot bilan.
          </p>
          <Link href="/aloqa" className="imk-btn" style={{ background: 'var(--land-surface-onlight)', color: 'var(--navy-900)' }}>
            Bog‘lanish
          </Link>
        </div>
      </LandingSection>
    </>
  );
}
