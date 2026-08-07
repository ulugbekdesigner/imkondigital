import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';

/** /xayriya/[id] yuklanayotganda — sarlavha, progress karta va forma joyi skeleti. */
export default function XayriyaDetailLoading() {
  return (
    <LandingSection tone="brand" ariaLabelledby="xayriya-detail-loading-title" reveal={false}>
      <CursorGlow tone="dark" />
      <Ornament variant="arch-legs" className="top-0" />
      <Ornament variant="arch-crown" className="bottom-0" />

      <div aria-hidden="true" className="relative mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="imk-skeleton" style={{ width: 130, height: 12 }} />
          <h2 id="xayriya-detail-loading-title" className="sr-only">
            Xayriya loyihasi yuklanmoqda
          </h2>
          <div className="imk-skeleton" style={{ width: '75%', height: 32 }} />
          <div className="imk-skeleton" style={{ width: '95%', height: 16 }} />
          <div className="imk-skeleton" style={{ width: '80%', height: 16 }} />
        </div>

        <div className="rounded-[20px] border border-line bg-paper p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="imk-skeleton" style={{ width: 140, height: 24 }} />
            <div className="imk-skeleton" style={{ width: 110, height: 14 }} />
          </div>
          <div className="imk-skeleton mt-4" style={{ width: '100%', height: 10 }} />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="imk-skeleton" style={{ width: 70, height: 22, borderRadius: 'var(--r-full)' }} />
            <div className="imk-skeleton" style={{ width: 120, height: 14 }} />
          </div>
        </div>

        <div className="rounded-[20px] border border-line bg-paper p-6">
          <div className="imk-skeleton" style={{ width: '40%', height: 18 }} />
          <div className="mt-4 flex gap-2">
            <div className="imk-skeleton" style={{ width: '33%', height: 44, borderRadius: 'var(--r-full)' }} />
            <div className="imk-skeleton" style={{ width: '33%', height: 44, borderRadius: 'var(--r-full)' }} />
            <div className="imk-skeleton" style={{ width: '33%', height: 44, borderRadius: 'var(--r-full)' }} />
          </div>
          <div className="imk-skeleton mt-4" style={{ width: '100%', height: 44, borderRadius: 'var(--r-md)' }} />
        </div>
      </div>
    </LandingSection>
  );
}
