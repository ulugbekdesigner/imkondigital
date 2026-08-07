import { LandingSection, CursorGlow } from '@/components/landing/primitives';

/** /imtiyozlar/yangi yuklanayotganda — orqaga havola, sarlavha va forma
 * maydonlari shakli bo'yicha skelet. */
export default function NewBenefitLoading() {
  return (
    <LandingSection tone="light" ariaLabelledby="land-yangi-imtiyoz-loading-title" reveal={false}>
      <CursorGlow tone="light" />
      <div aria-hidden="true" className="relative mx-auto max-w-xl">
        <div className="imk-skeleton" style={{ width: 150, height: 14 }} />

        <div className="mt-4 flex items-center gap-3">
          <div
            className="imk-skeleton"
            style={{ width: 44, height: 44, borderRadius: 'var(--r-full)', flexShrink: 0 }}
          />
          <h2 id="land-yangi-imtiyoz-loading-title" className="sr-only">
            Yangi imtiyoz sahifasi yuklanmoqda
          </h2>
          <div className="imk-skeleton" style={{ width: '65%', height: 26 }} />
        </div>
        <div className="imk-skeleton mt-3" style={{ width: '85%', height: 16 }} />

        <div className="mt-6 flex flex-col gap-5 rounded-[20px] border border-line bg-paper p-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="imk-skeleton" style={{ width: '30%', height: 12 }} />
              <div
                className="imk-skeleton"
                style={{ width: '100%', height: 44, borderRadius: 'var(--r-md)' }}
              />
            </div>
          ))}
          <div
            className="imk-skeleton"
            style={{ width: 160, height: 44, borderRadius: 'var(--r-full)' }}
          />
        </div>
      </div>
    </LandingSection>
  );
}
