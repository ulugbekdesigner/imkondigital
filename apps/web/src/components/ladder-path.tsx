import { Fragment } from 'react';
import Link from 'next/link';
import { StepBadge } from '@imkon/ui';
import { NARVON } from '@/lib/narvon';

/** Foydalanuvchining Raqamli Narvondagi joriy pog'onasi — 0-4 tugun + ulagich chiziqlar. */
export function LadderPath({ ladderStep }: { ladderStep: number }) {
  const nextRung = NARVON.find((r) => r.step === ladderStep + 1);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line p-4">
      <span className="font-sans text-base font-bold text-ink">Narvon bo'ylab yo'l</span>
      <div className="flex items-center">
        {NARVON.map((rung, i) => (
          <Fragment key={rung.step}>
            <StepBadge
              step={rung.step}
              className={`shrink-0 ${
                rung.step === ladderStep
                  ? 'ring-4 ring-bright/20'
                  : rung.step > ladderStep
                    ? 'opacity-50'
                    : ''
              }`}
              aria-current={rung.step === ladderStep ? 'step' : undefined}
            />
            {i < NARVON.length - 1 && (
              <span
                aria-hidden="true"
                className={`mx-1 h-[3px] min-w-[6px] flex-1 ${rung.step < ladderStep ? 'bg-bright' : 'bg-line'}`}
              />
            )}
          </Fragment>
        ))}
      </div>
      <span className="font-sans text-xs text-ink-soft">
        {nextRung ? (
          <>
            {nextRung.step}-pog'onaga o'tish uchun:{' '}
            <Link
              href={`/kurslar?step=${nextRung.step}`}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              shu bosqich kursini tugating
            </Link>
          </>
        ) : (
          "Siz Raqamli Narvonning eng yuqori pog'onasidasiz!"
        )}
      </span>
    </div>
  );
}
