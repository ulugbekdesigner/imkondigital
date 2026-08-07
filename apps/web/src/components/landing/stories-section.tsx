import type { SuccessStoryOut } from '@/lib/success-stories-api';
import { LandingSection, CursorGlow, Ornament } from './primitives';
import { ZiyoPreviewChat } from './ziyo-preview-chat';

export function StoriesSection({ stories }: { stories: SuccessStoryOut[] }) {
  const shown = stories.slice(0, 2);

  return (
    <LandingSection tone="dark" ariaLabelledby="land-stories-title">
      <CursorGlow tone="dark" />
      <div data-depth={3} className="imk-blob left-[15%] -top-36 h-[560px] w-[560px]" style={{ background: 'var(--land-blob-brand)' }} aria-hidden="true" />

      <div className="relative grid grid-cols-1 gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="flex flex-col items-start gap-5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--land-teal-300)' }}>
            Natijalar · Insonlar
          </span>
          <h2
            id="land-stories-title"
            className="max-w-[10em] text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-white md:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Umid — bu jadvaldagi raqam emas, ish joyi
          </h2>
          <p className="max-w-[27em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-dark-muted)', textWrap: 'pretty' }}>
            Har bir yo&apos;l shu sahifadan boshlanadi — narvonning har pog&apos;onasi haqiqiy odamlar bilan
            to&apos;ldiriladi.
          </p>

          {shown.length > 0 ? (
            <div className="flex w-full max-w-[30em] flex-col gap-3">
              {shown.map((s) => (
                <div key={s.id} className="imk-card__row items-start gap-3.5">
                  <span
                    aria-hidden="true"
                    className="h-11 w-11 flex-shrink-0 rounded-full"
                    style={{ background: 'linear-gradient(140deg, var(--land-teal-400), var(--land-brand-500))' }}
                  />
                  <div className="flex flex-col gap-1">
                    <p className="m-0 text-base leading-relaxed" style={{ color: 'var(--land-text-on-dark)' }}>
                      &ldquo;{s.quote}&rdquo;
                    </p>
                    <span className="text-sm" style={{ color: 'var(--land-text-on-dark-muted)' }}>
                      {s.full_name}, {s.profession}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="imk-card__row max-w-[30em] items-start gap-3.5">
              <div className="flex flex-col gap-1">
                <p className="m-0 text-base leading-relaxed" style={{ color: 'var(--land-text-on-dark)' }}>
                  Birinchi bitiruvchilarimiz hozir narvon bo&apos;ylab yuqoriga chiqmoqda — tez orada
                  ularning haqiqiy hikoyalari shu yerda paydo bo&apos;ladi.
                </p>
              </div>
            </div>
          )}
        </div>

        <ZiyoPreviewChat />
      </div>
      <Ornament variant="seam" className="bottom-0" />
    </LandingSection>
  );
}
