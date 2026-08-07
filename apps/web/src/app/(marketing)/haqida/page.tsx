import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';
import { LandingEffects } from '@/components/landing/landing-effects';
import { HeartIcon, ChartIcon, ShieldIcon, EyeIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Haqida',
  description:
    'IMKON Digital — yordam emas, imkoniyat. Missiya, vizyon va qadriyatlarimiz bilan tanishing.',
  alternates: { canonical: '/haqida' },
};

const VALUES = [
  {
    title: 'Qadr-qimmat',
    desc: 'Har bir ekran foydalanuvchiga teng huquqli professional sifatida murojaat qiladi. Rahm emas — hurmat.',
    icon: HeartIcon,
  },
  {
    title: 'Natija, jarayon emas',
    desc: 'Muvaffaqiyat o‘lchovi — sertifikatlar soni emas, foydalanuvchining real daromadi.',
    icon: ChartIcon,
  },
  {
    title: 'Accessibility — asos',
    desc: 'WCAG 2.2 AA birinchi kundan dizayn poydevori: screen reader, klaviatura, kontrast, subtitr.',
    icon: ShieldIcon,
  },
  {
    title: 'Shaffoflik',
    desc: 'Har bir grant va mablag‘ real vaqt dashboardida. Qayerda, qancha, qanday natija — ochiq.',
    icon: EyeIcon,
  },
];

const NOT_VS = [
  { not: 'Xayriya fondi', is: 'Ijtimoiy biznes' },
  { not: 'Oddiy kurs platformasi', is: 'Trayektoriya platformasi — kurs faqat 1 bosqich' },
  { not: 'Ish e‘lonlari doskasi', is: 'AI moslashtiruvli inklyuziv bandlik tizimi' },
  { not: 'Grant tugasa to‘xtaydigan loyiha', is: 'O‘z daromad modeliga ega barqaror platforma' },
];

export default function AboutPage() {
  return (
    <>
      <LandingEffects />
      <LandingSection tone="dark" ariaLabelledby="land-about-title">
        <CursorGlow tone="dark" />
        <Ornament variant="lattice" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-6">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest"
            style={{ borderColor: 'var(--land-line-dark-strong)', color: 'var(--land-text-on-dark-muted)' }}
          >
            Loyiha falsafasi
          </span>
          <h1
            id="land-about-title"
            className="max-w-[14em] text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white md:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Biz yordam bermaymiz — biz{' '}
            <span
              style={{ fontFamily: 'var(--land-font-accent)', fontStyle: 'italic', fontWeight: 400, color: 'var(--land-teal-300)' }}
            >
              imkoniyat
            </span>{' '}
            yaratamiz
          </h1>
          <p className="max-w-[34em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-dark-muted)', textWrap: 'pretty' }}>
            Yordam odamni qaram qiladi. Imkoniyat odamni mustaqil qiladi. Eng katta hurmat —
            insonga daromad topish, oila boqish va boshqalarga ustoz bo‘lish yo‘lini ochib
            berishdir.
          </p>

          <div
            className="imk-card__row w-full items-start gap-3.5"
            style={{ borderLeft: '3px solid var(--land-brand-400)', maxWidth: '34em' }}
          >
            <p className="m-0 text-base leading-relaxed" style={{ color: 'var(--land-text-on-dark)' }}>
              <strong className="text-white">Missiya:</strong> O‘zbekistondagi har bir
              nogironligi bor inson uchun kasb, daromad va iqtisodiy mustaqillikka olib
              boradigan raqamli yo‘lni yaratish.
            </p>
          </div>

          <Link href="/royxatdan-otish" className="imk-btn imk-btn--primary">
            Boshlash
          </Link>
        </div>
      </LandingSection>

      <LandingSection tone="light" ariaLabelledby="land-values-title">
        <CursorGlow tone="light" />
        <h2
          id="land-values-title"
          className="relative max-w-[14em] text-3xl font-bold leading-[1.1] tracking-[-0.03em] md:text-4xl"
          style={{ textWrap: 'balance' }}
        >
          Qadriyatlarimiz
        </h2>
        <div className="relative mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="imk-card">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'rgba(111,179,207,0.16)', color: 'var(--land-teal-300)' }}
              >
                <v.icon />
              </span>
              <h3 className="imk-card__title">{v.title}</h3>
              <p className="imk-card__body">{v.desc}</p>
            </div>
          ))}
        </div>
      </LandingSection>

      <LandingSection tone="dark" ariaLabelledby="land-notvs-title">
        <CursorGlow tone="dark" />
        <h2
          id="land-notvs-title"
          className="relative max-w-[13em] text-3xl font-bold leading-[1.1] tracking-[-0.03em] text-white md:text-4xl"
          style={{ textWrap: 'balance' }}
        >
          IMKON nima{' '}
          <span
            style={{ fontFamily: 'var(--land-font-accent)', fontStyle: 'italic', fontWeight: 400, color: 'var(--land-teal-300)' }}
          >
            emas
          </span>
        </h2>

        <div className="imk-glass relative mt-8 overflow-x-auto p-0 [contain:layout]">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <caption className="sr-only">IMKON nima emas va nima ekanligi</caption>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--land-line-dark)' }}>
                <th
                  scope="col"
                  className="py-4 pl-6 pr-4 text-sm font-semibold"
                  style={{ color: 'var(--land-text-on-dark-dim)' }}
                >
                  IMKON EMAS
                </th>
                <th scope="col" className="py-4 pr-6 text-sm font-semibold text-white">
                  IMKON
                </th>
              </tr>
            </thead>
            <tbody>
              {NOT_VS.map((row) => (
                <tr key={row.not} style={{ borderBottom: '1px solid var(--land-line-dark)' }}>
                  <td
                    className="py-4 pl-6 pr-4 text-base"
                    style={{ color: 'var(--land-text-on-dark-muted)' }}
                  >
                    {row.not}
                  </td>
                  <td className="py-4 pr-6 text-base font-medium text-white">{row.is}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LandingSection>
    </>
  );
}
