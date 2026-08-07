import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';

/** /verify yuklanayotganda — qidiruv kartasi shakli bo'yicha skelet. */
export default function VerifyLoading() {
  return (
    <LandingSection tone="dark" ariaLabelledby="land-verify-loading-title" reveal={false}>
      <CursorGlow tone="dark" />
      <Ornament variant="medallion" className="-right-32 top-0" />
      <div aria-hidden="true" className="relative mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="imk-skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--r-full)' }} />
        <h2 id="land-verify-loading-title" className="sr-only">
          Sertifikat tekshirish sahifasi yuklanmoqda
        </h2>
        <div className="imk-skeleton" style={{ width: '80%', height: 34 }} />
        <div className="imk-skeleton" style={{ width: '90%', height: 16 }} />

        <div
          className="imk-card w-full"
          style={{ background: 'var(--land-surface-onlight)', border: '1px solid var(--land-line-light)' }}
        >
          <div className="imk-skeleton" style={{ width: '100%', height: 44, borderRadius: 'var(--r-md)' }} />
          <div className="imk-skeleton" style={{ width: 120, height: 44, borderRadius: 'var(--r-full)' }} />
        </div>
      </div>
    </LandingSection>
  );
}
