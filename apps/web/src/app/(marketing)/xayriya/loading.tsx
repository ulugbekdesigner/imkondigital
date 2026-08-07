import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';

/**
 * /xayriya ro'yxati yuklanayotganda (Next.js Suspense fallback) —
 * kartochka gridini shakl bo'yicha taqlid qiluvchi skelet (docs/design/README.md:
 * har ro'yxatda "yuklanmoqda" holati majburiy).
 */
export default function XayriyaLoading() {
  return (
    <LandingSection tone="brand" ariaLabelledby="xayriya-loading-title" reveal={false}>
      <CursorGlow tone="dark" />
      <Ornament variant="arch-legs" className="top-0" />
      <Ornament variant="arch-crown" className="bottom-0" />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <div className="imk-skeleton" style={{ width: 160, height: 12 }} />
        <h2 id="xayriya-loading-title" className="sr-only">
          Xayriya loyihalari yuklanmoqda
        </h2>
        <div className="imk-skeleton" style={{ width: '70%', height: 34 }} />
        <div className="imk-skeleton" style={{ width: '55%', height: 16 }} />
      </div>

      <div
        aria-hidden="true"
        className="relative mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="imk-card gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="imk-skeleton" style={{ width: 64, height: 22, borderRadius: 'var(--r-full)' }} />
              <div className="imk-skeleton" style={{ width: 72, height: 12 }} />
            </div>
            <div className="imk-skeleton" style={{ width: '85%', height: 20 }} />
            <div className="imk-skeleton" style={{ width: '100%', height: 14 }} />
            <div className="imk-skeleton" style={{ width: '92%', height: 14 }} />
            <div className="mt-auto flex flex-col gap-2.5">
              <div className="imk-skeleton" style={{ width: '100%', height: 10 }} />
              <div className="imk-skeleton" style={{ width: '60%', height: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
