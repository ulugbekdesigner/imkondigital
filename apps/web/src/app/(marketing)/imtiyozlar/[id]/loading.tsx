import { LandingSection, CursorGlow } from '@/components/landing/primitives';

/** /imtiyozlar/[id] yuklanayotganda — orqaga havola, sarlavha, belgilar va
 * tavsif blokining shakli bo'yicha skelet. */
export default function BenefitDetailLoading() {
  return (
    <LandingSection tone="light" ariaLabelledby="land-imtiyoz-detail-loading-title" reveal={false}>
      <CursorGlow tone="light" />
      <div aria-hidden="true" className="relative mx-auto flex max-w-3xl flex-col gap-6">
        <div className="imk-skeleton" style={{ width: 150, height: 14 }} />

        <div className="flex items-start gap-4">
          <div
            className="imk-skeleton"
            style={{ width: 48, height: 48, borderRadius: 'var(--r-full)', flexShrink: 0 }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <div
                className="imk-skeleton"
                style={{ width: 70, height: 22, borderRadius: 'var(--r-full)' }}
              />
              <div
                className="imk-skeleton"
                style={{ width: 90, height: 22, borderRadius: 'var(--r-full)' }}
              />
            </div>
            <h2 id="land-imtiyoz-detail-loading-title" className="sr-only">
              Imtiyoz tafsiloti yuklanmoqda
            </h2>
            <div className="imk-skeleton" style={{ width: '70%', height: 28 }} />
            <div className="imk-skeleton" style={{ width: '35%', height: 14 }} />
          </div>
        </div>

        <div className="rounded-[20px] border border-line bg-paper p-6">
          <div className="imk-skeleton" style={{ width: 90, height: 20 }} />
          <div className="mt-3 flex flex-col gap-2">
            <div className="imk-skeleton" style={{ width: '100%', height: 14 }} />
            <div className="imk-skeleton" style={{ width: '90%', height: 14 }} />
            <div className="imk-skeleton" style={{ width: '60%', height: 14 }} />
          </div>
        </div>

        <div
          className="imk-skeleton"
          style={{ width: 160, height: 44, borderRadius: 'var(--r-full)' }}
        />
      </div>
    </LandingSection>
  );
}
