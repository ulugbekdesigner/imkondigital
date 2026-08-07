import { LandingSection, CursorGlow } from '@/components/landing/primitives';

/** /tariflar yuklanayotganda — 3 ta tarif kartasi shakli bo'yicha skelet. */
export default function TariflarLoading() {
  return (
    <LandingSection tone="light" ariaLabelledby="land-tariflar-loading-title" reveal={false}>
      <CursorGlow tone="light" />
      <div aria-hidden="true" className="relative mb-10 flex flex-wrap items-end justify-between gap-10">
        <div className="imk-skeleton" style={{ width: 260, height: 40 }} />
        <h2 id="land-tariflar-loading-title" className="sr-only">
          Tariflar yuklanmoqda
        </h2>
        <div className="imk-skeleton" style={{ width: 320, height: 16 }} />
      </div>

      <div aria-hidden="true" className="relative grid grid-cols-1 gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="imk-card imk-card--onlight gap-3">
            <div className="imk-skeleton" style={{ width: 70, height: 12 }} />
            <div className="imk-skeleton" style={{ width: 110, height: 28 }} />
            <div className="mt-1 flex flex-col gap-2.5">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="imk-skeleton" style={{ width: `${90 - j * 8}%`, height: 12 }} />
              ))}
            </div>
            <div className="imk-skeleton mt-auto" style={{ width: '100%', height: 44, borderRadius: 'var(--r-full)' }} />
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
