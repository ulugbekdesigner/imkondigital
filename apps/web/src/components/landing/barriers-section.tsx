import { LandingSection, CursorGlow, LandingCard } from './primitives';

const BARRIERS = [
  {
    title: "Transport va bino to'sig'i yo'q",
    desc: 'Raqamli ish uydan bajariladi — jismoniy borish shart emas.',
  },
  {
    title: "Hudud to'sig'i yo'q",
    desc: 'Andijondagi dizayner Toshkent yoki Dubay mijoziga xizmat qiladi.',
  },
  {
    title: "Stereotip to'sig'i yo'q",
    desc: "Raqamli ishda mijoz avval natijani ko'radi, keyin insonni.",
  },
];

export function BarriersSection() {
  return (
    <LandingSection tone="dark" ariaLabelledby="land-barriers-title">
      <CursorGlow tone="dark" />
      <h2
        id="land-barriers-title"
        className="relative max-w-[13em] text-3xl font-bold leading-[1.1] tracking-[-0.03em] text-white md:text-5xl"
        style={{ textWrap: 'balance' }}
      >
        Nega aynan{' '}
        <span style={{ color: 'var(--land-teal-300)' }}>raqamli</span> kasb
      </h2>
      <div className="relative mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {BARRIERS.map((b) => (
          <LandingCard key={b.title} title={b.title}>
            {b.desc}
          </LandingCard>
        ))}
      </div>
    </LandingSection>
  );
}
