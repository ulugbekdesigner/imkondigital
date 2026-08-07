'use client';

import { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Ko'rinadigan label — a11y uchun majburiy (yoki aria-label bering). */
  label?: ReactNode;
  /** Xato matni — rang bilan emas, matn bilan ham ko'rsatiladi (WCAG 1.4.1). */
  error?: string;
  /** Yordamchi tavsif. */
  hint?: string;
}

/* Loyihada icon kutubxonasi yo'q (shell-icons.tsx naqshiga mos) — faqat shu
   yerda kerak bo'lgani uchun mahalliy, minimal SVG'lar. */
function EyeIcon(props: { hidden: boolean }) {
  return props.hidden ? (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4l12 12" />
      <path d="M8.3 5.2A8.7 8.7 0 0 1 10 5c5 0 8 5 8 5a13.5 13.5 0 0 1-2.7 3.2M5.6 6.6C3.4 8 2 10 2 10s3 5 8 5c1 0 1.9-.2 2.7-.5" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, required, type, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const isPassword = type === 'password';
    const [revealed, setRevealed] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="font-sans text-base font-medium text-ink">
            {label}
            {required && (
              <span className="text-error" aria-hidden="true">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (revealed ? 'text' : 'password') : type}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={cn(hintId, errorId) || undefined}
            className={cn(
              // IMKON Interface.dc.html 4b-blok — 48px balandlik, TO'LIQ pill
              // (radius 999px), oldin oddiy "rounded" (10px) edi.
              'h-12 w-full rounded-full border bg-paper px-[18px] font-sans text-base text-ink',
              'placeholder:text-ink-soft',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
              'disabled:cursor-not-allowed disabled:border-line/60 disabled:bg-surface-2 disabled:text-ink-soft/70 disabled:opacity-100',
              isPassword && 'pr-[54px]',
              error ? 'border-error' : 'border-line',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? 'Parolni yashirish' : "Parolni ko'rsatish"}
              // 4b-blok — parol maydoni ichidagi 36px doira-tugma (bg-surface-2),
              // oddiy shaffof ikonka emas.
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface-2 text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <EyeIcon hidden={revealed} />
            </button>
          )}
        </div>
        {hint && !error && (
          <p id={hintId} className="font-sans text-xs text-ink-soft">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="font-sans text-xs font-medium text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
