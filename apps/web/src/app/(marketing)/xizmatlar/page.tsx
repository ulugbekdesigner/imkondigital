import type { Metadata } from 'next';
import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';
import { LandingEffects } from '@/components/landing/landing-effects';
import { ServiceInterestForm } from '@/components/service-interest-form';
import { EditIcon, SparkIcon, VideoIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'B2B xizmatlar - tez kunda',
  description:
    "IMKON Digital bitiruvchilari jamoasi orqali biznesingizga SMM, mobilografiya va montaj xizmatlarini bozordan arzonroq narxda taqdim etadi. Tez kunda.",
  alternates: { canonical: '/xizmatlar' },
};

const PACKAGES = [
  {
    title: 'SMM va kontent',
    desc: "Kontent-reja, postlar, storiz - bitiruvchi jamoalar tomonidan, tajribali mentor nazorati ostida.",
    icon: SparkIcon,
  },
  {
    title: 'Mobilografiya va montaj',
    desc: 'Telefon kamerada professional syomka va reels/video montaj - joyingizga borib ham ishlaymiz.',
    icon: VideoIcon,
  },
  {
    title: "Ssenariy va kopirayting",
    desc: "Post matnlari, reels ssenariylari, reklama matnlari - o'zbek va rus tillarida.",
    icon: EditIcon,
  },
];

export default function ServicesPage() {
  return (
    <>
      <LandingEffects />
      <LandingSection tone="dark" ariaLabelledby="land-services-title">
        <CursorGlow tone="dark" />
        <Ornament variant="lattice" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-6">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest"
            style={{ borderColor: 'var(--land-line-dark-strong)', color: 'var(--land-text-on-dark-muted)' }}
          >
            Tez kunda
          </span>
          <h1
            id="land-services-title"
            className="max-w-[14em] text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white md:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Bitiruvchilarimiz{' '}
            <span
              style={{ fontFamily: 'var(--land-font-accent)', fontStyle: 'italic', fontWeight: 400, color: 'var(--land-teal-300)' }}
            >
              biznesingizga
            </span>{' '}
            xizmat qiladi
          </h1>
          <p className="max-w-[34em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-dark-muted)', textWrap: 'pretty' }}>
            IMKON Digital'da tayyorlangan jamoalar - SMM, mobilografiya, montaj va kontent
            xizmatlarini bozordan sezilarli arzonroq narxda taqdim etadi. Har jamoada tajribali
            mentor sifat nazoratini olib boradi. Hozircha rejalashtirish bosqichida - birinchilardan
            bo&apos;lib xabardor bo&apos;lish uchun emailingizni qoldiring.
          </p>
          <ServiceInterestForm />
        </div>
      </LandingSection>

      <LandingSection tone="light" ariaLabelledby="land-packages-title">
        <CursorGlow tone="light" />
        <h2
          id="land-packages-title"
          className="relative max-w-[16em] text-3xl font-bold leading-[1.1] tracking-[-0.03em] md:text-4xl"
          style={{ textWrap: 'balance' }}
        >
          Rejalashtirilgan xizmatlar
        </h2>
        <div className="relative mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PACKAGES.map((p) => (
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
    </>
  );
}
