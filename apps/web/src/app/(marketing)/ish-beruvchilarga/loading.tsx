import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';

/** /ish-beruvchilarga yuklanayotganda — hero statistikasi + taklif kartalari shakli bo'yicha skelet. */
export default function EmployersLoading() {
  return (
    <>
      <LandingSection tone="dark" ariaLabelledby="land-employers-loading-title" reveal={false}>
        <Ornament variant="lattice" />
        <div aria-hidden="true" className="relative mx-auto flex max-w-3xl flex-col items-start gap-6">
          <div className="imk-skeleton" style={{ width: 160, height: 30, borderRadius: 'var(--r-full)' }} />
          <h2 id="land-employers-loading-title" className="sr-only">
            Ish beruvchilarga sahifasi yuklanmoqda
          </h2>
          <div className="imk-skeleton" style={{ width: '85%', height: 48 }} />
          <div className="imk-skeleton" style={{ width: '60%', height: 16 }} />
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}
              >
                <div className="imk-skeleton" style={{ width: '70%', height: 22 }} />
                <div className="imk-skeleton" style={{ width: '90%', height: 12 }} />
              </div>
            ))}
          </div>
          <div className="imk-skeleton" style={{ width: 168, height: 44, borderRadius: 'var(--r-full)' }} />
        </div>
      </LandingSection>

      <LandingSection tone="light" ariaLabelledby="land-employers-loading-offers" reveal={false}>
        <CursorGlow tone="light" />
        <h2 id="land-employers-loading-offers" className="sr-only">
          Takliflar yuklanmoqda
        </h2>
        <div aria-hidden="true" className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="imk-card gap-3">
              <div className="imk-skeleton" style={{ width: 40, height: 40, borderRadius: 'var(--r-md)' }} />
              <div className="imk-skeleton" style={{ width: '60%', height: 18 }} />
              <div className="imk-skeleton" style={{ width: '95%', height: 12 }} />
              <div className="imk-skeleton" style={{ width: '80%', height: 12 }} />
            </div>
          ))}
        </div>
      </LandingSection>
    </>
  );
}
