import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './lib/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans font-semibold',
    'transition-[color,background-color,border-color,transform,box-shadow] duration-fast select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100',
    // Nozik "qimmat" tuyg'usi — bosilganda siqiladi, chiqarilganda qaytadi (V2 A5)
    'hover:-translate-y-px active:scale-[0.97]',
    'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:brightness-110',
        secondary: 'bg-mint text-ink hover:bg-mint/70',
        outline: 'border-2 border-primary text-primary hover:bg-mint',
        ghost: 'text-primary hover:bg-mint',
        danger: 'bg-error text-error-fg hover:brightness-110',
      },
      // IMKON Interface.dc.html 4b-blok — balandlik aniq 36/44/52px (Tailwind
      // standart shkalasi 44/48/56 berardi, spec bilan mos emas edi). Kichik
      // (36px) — WCAG 2.2 SC 2.5.8 24px minimumidan yuqori, min-h-touch
      // (44px ichki qoida) faqat o'rta/katta o'lchamda qo'llanadi.
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'min-h-touch h-11 px-5 text-base',
        lg: 'min-h-touch h-[52px] px-7 text-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** IMKON Interface.dc.html 4b-blok — 6-holat ("Yuklanmoqda"): aylanuvchi
   * belgi + tugma o'chirilgan. Matnni (masalan "Saqlanmoqda…") chaqiruvchi
   * o'zi almashtiradi — bu faqat vizual spinner qatlamini qo'shadi. */
  isLoading?: boolean;
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
    >
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M18 10a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
