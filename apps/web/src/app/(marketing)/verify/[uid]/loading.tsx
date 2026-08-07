import { LandingSection, CursorGlow } from '@/components/landing/primitives';

/** /verify/[uid] natija yuklanayotganda — natija kartasi shakli bo'yicha skelet. */
export default function VerifyResultLoading() {
  return (
    <LandingSection tone="dark" ariaLabelledby="land-verify-result-loading-title" reveal={false}>
      <CursorGlow tone="dark" />
      <div aria-hidden="true" className="relative mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="imk-skeleton" style={{ width: 56, height: 56, borderRadius: 'var(--r-full)' }} />
        <h2 id="land-verify-result-loading-title" className="sr-only">
          Sertifikat natijasi tekshirilmoqda
        </h2>
        <div className="imk-skeleton" style={{ width: '75%', height: 34 }} />
        <div className="imk-skeleton" style={{ width: '85%', height: 16 }} />

        <div
          className="imk-card w-full"
          style={{ background: 'var(--land-surface-onlight)', border: '1px solid var(--land-line-light)' }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="imk-skeleton" style={{ width: '60%', height: 12 }} />
            <div className="imk-skeleton" style={{ width: '60%', height: 12 }} />
            <div className="imk-skeleton" style={{ width: '80%', height: 18 }} />
            <div className="imk-skeleton" style={{ width: '80%', height: 18 }} />
          </div>
          <div className="mt-5 flex gap-3">
            <div className="imk-skeleton" style={{ width: '100%', height: 44, borderRadius: 'var(--r-full)' }} />
            <div className="imk-skeleton" style={{ width: '100%', height: 44, borderRadius: 'var(--r-full)' }} />
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
