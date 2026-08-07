import type { Metadata } from 'next';
import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';
import { LandingEffects } from '@/components/landing/landing-effects';
import { SendIcon, ClipboardIcon, StarIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Aloqa',
  description: 'IMKON Digital jamoasi bilan bog‘laning — foydalanuvchi, ish beruvchi yoki donor sifatida.',
  alternates: { canonical: '/aloqa' },
};

const CHANNELS = [
  {
    label: 'Telegram',
    value: '@imkondigital',
    href: 'https://t.me/imkondigital',
    desc: 'Eng tez javob — savollar va hamkorlik uchun.',
    icon: SendIcon,
  },
  {
    label: 'Email',
    value: 'info@imkondigital.uz',
    href: 'mailto:info@imkondigital.uz',
    desc: 'Rasmiy so‘rovlar, donor va ish beruvchi takliflari.',
    icon: ClipboardIcon,
  },
  {
    label: 'Instagram',
    value: '@imkondigital',
    href: 'https://instagram.com/imkondigital',
    desc: 'Muvaffaqiyat hikoyalari va yangi imkoniyatlar.',
    icon: StarIcon,
  },
];

export default function ContactPage() {
  return (
    <>
      <LandingEffects />
      <LandingSection tone="dark" ariaLabelledby="land-contact-title">
        <CursorGlow tone="dark" />
        <Ornament variant="seam" className="bottom-0" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-5">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest"
            style={{ borderColor: 'var(--land-line-dark-strong)', color: 'var(--land-text-on-dark-muted)' }}
          >
            Aloqa
          </span>
          <h1
            id="land-contact-title"
            className="max-w-[12em] text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white md:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Biz bilan{' '}
            <span
              style={{ fontFamily: 'var(--land-font-accent)', fontStyle: 'italic', fontWeight: 400, color: 'var(--land-teal-300)' }}
            >
              bog‘laning
            </span>
          </h1>
          <p className="max-w-[30em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-dark-muted)', textWrap: 'pretty' }}>
            Foydalanuvchi, ish beruvchi yoki donor — sizga eng qulay kanalni tanlang. Tez orada
            javob beramiz.
          </p>
        </div>
      </LandingSection>

      <LandingSection tone="light" ariaLabelledby="land-channels-title">
        <CursorGlow tone="light" />
        <h2 id="land-channels-title" className="sr-only">
          Aloqa kanallari
        </h2>
        <ul className="relative grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CHANNELS.map((c) => (
            <li key={c.label} className="imk-card">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'rgba(111,179,207,0.16)', color: 'var(--land-teal-300)' }}
              >
                <c.icon />
              </span>
              <span className="imk-card__label">{c.label}</span>
              <a
                href={c.href}
                className="-mt-2 text-lg font-bold no-underline hover:underline"
                style={{ color: 'white' }}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {c.value}
              </a>
              <p className="imk-card__body">{c.desc}</p>
            </li>
          ))}
        </ul>
      </LandingSection>
    </>
  );
}
