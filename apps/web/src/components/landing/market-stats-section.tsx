import { CountUp } from '@imkon/ui';
import { LandingSection, CursorGlow } from './primitives';

const MARKET_STATS: { value: number; prefix?: string; suffix?: string; label: string }[] = [
  { value: 1_000_000, suffix: '+', label: "O'zbekistonda nogironligi bor inson" },
  { value: 600_000, suffix: '+', label: 'Mehnatga layoqatli, salohiyatli' },
  { value: 366_000, prefix: '~', label: 'Ish qidirayotgan — bevosita imkoniyat' },
  { value: 3_800_000, label: "O'rtacha oylik maosh, so'm (2026)" },
];

export function MarketStatsSection() {
  return (
    <LandingSection tone="light" ariaLabelledby="land-stats-title">
      <CursorGlow tone="light" />
      <div className="relative mb-10 flex flex-wrap items-end justify-between gap-10">
        <h2
          id="land-stats-title"
          className="max-w-[13em] text-3xl font-bold leading-[1.1] tracking-[-0.03em] md:text-5xl"
          style={{ textWrap: 'balance' }}
        >
          O&apos;zbekistonda imkoniyat qanchalik{' '}
          <span style={{ color: 'var(--land-brand-500)' }}>katta</span>
        </h2>
        <p className="max-w-[24em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-light-muted)', textWrap: 'pretty' }}>
          Bu insonlar mehnatga layoqatli va salohiyatli — lekin ish bilan ta&apos;minlanmagan. IMKON
          Digital shu bo&apos;shliqni to&apos;ldiradi.
        </p>
      </div>
      <dl className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MARKET_STATS.map((s) => (
          <div key={s.label} className="imk-card">
            <dt className="font-mono text-2xl font-bold text-white md:text-[26px]">
              {s.prefix}
              <CountUp value={s.value} />
              {s.suffix}
            </dt>
            <dd className="imk-card__body">{s.label}</dd>
          </div>
        ))}
      </dl>
      <p className="relative mt-5 text-xs" style={{ color: 'var(--land-text-on-light-dim)' }}>
        Manba: Ijtimoiy himoya milliy agentligi, 2026.
      </p>
    </LandingSection>
  );
}
