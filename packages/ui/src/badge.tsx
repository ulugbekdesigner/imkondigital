import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './lib/cn';

/* IMKON Interface.dc.html 4b-blok ("Belgilar, filtr, ko'rsatkich") — pill
   (radius 999), 14px/600, padding 9px 15px. Har status matn bilan ham
   ajraladi (rang yagona signal emas) — chaqiruvchi component matnni beradi. */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-[15px] py-[9px] font-sans text-xs font-semibold leading-none',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-2 text-ink-soft',
        primary: 'bg-bright text-white',
        success: 'bg-success-bg text-success',
        warn: 'bg-warn-bg text-warn',
        error: 'bg-error-bg text-error',
        info: 'bg-info-bg text-info',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Narvon pog'onasi (0→4) — signature element. Rang bilan birga raqam ham beriladi (a11y). */
export function StepBadge({
  step,
  className,
  ...props
}: { step: 0 | 1 | 2 | 3 | 4 } & HTMLAttributes<HTMLSpanElement>) {
  const stepBg = ['bg-step-0', 'bg-step-1', 'bg-step-2', 'bg-step-3', 'bg-step-4'][step];
  // Barcha pog'ona ranglari ochiq-yashil→oltin — to'q matn eng yaxshi kontrast beradi.
  return (
    <span
      className={cn(
        'inline-flex min-h-touch min-w-touch items-center justify-center rounded-sm px-2 font-mono text-base font-bold text-deep',
        stepBg,
        className,
      )}
      aria-label={`Narvon pog'onasi ${step}`}
      {...props}
    >
      {step}
    </span>
  );
}

export { badgeVariants };
