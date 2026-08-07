import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './lib/cn';

const glassCardVariants = cva(
  [
    'relative rounded-xl border backdrop-blur-lg backdrop-saturate-150',
    'transition-[transform,box-shadow] duration-slow motion-reduce:transition-none',
    // Nozik ichki yuqori-chiziq — shisha panelning yorug' qirrasi (real oyna
    // effekti fonda tekstura bo'lmasa ham ko'rinishi uchun, faqat token orqali)
    'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px',
    'before:rounded-t-xl before:bg-gradient-to-r before:from-transparent before:via-deep-fg/60 before:to-transparent',
  ],
  {
    variants: {
      /** `on-dark` — bg-deep kabi to'q fonlar ustida; `on-light` — paper kabi ochiq fonlar ustida. */
      surface: {
        'on-dark': 'border-deep-fg/15 bg-deep-fg/5 shadow-glass',
        'on-light': 'border-line/70 bg-paper/60 shadow-glass',
      },
      /** Sichqoncha ustiga kelganda nozik ko'tarilish + porlash — "qimmat" tuyg'usi uchun. */
      hover: {
        true: 'hover:-translate-y-1 hover:shadow-glow',
        false: '',
      },
    },
    defaultVariants: {
      surface: 'on-light',
      hover: false,
    },
  },
);

export interface GlassCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, surface, hover, ...props }, ref) => (
    <div ref={ref} className={cn(glassCardVariants({ surface, hover }), className)} {...props} />
  ),
);
GlassCard.displayName = 'GlassCard';

export { glassCardVariants };
