'use client';

import { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Ko'rinadigan label - a11y uchun tavsiya etiladi (yoki aria-label bering). */
  label?: ReactNode;
  hint?: string;
  error?: string;
}

/* QA_AUDIT D9: xom <input type="file"> brauzer-standart "Choose File" matnini
   ko'rsatadi (inglizcha, loyihaning boshqa hech bir joyida ishlatilmaydi) -
   xom inputni ko'rinmas qilib (sr-only), stillangan label-tugma bilan
   almashtiramiz. Tanlangan fayl nomi alohida ko'rsatiladi. */
export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, label, hint, error, id, onChange, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [fileName, setFileName] = useState<string | null>(null);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="font-sans text-base font-medium text-ink">
            {label}
          </label>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <label
            htmlFor={inputId}
            className="inline-flex min-h-touch cursor-pointer items-center rounded-full border border-line bg-surface-2 px-4 font-sans text-sm font-semibold text-ink hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Fayl tanlash
          </label>
          <span className="min-w-0 truncate font-sans text-sm text-ink-soft">
            {fileName ?? "Fayl tanlanmagan"}
          </span>
        </div>
        <input
          ref={ref}
          id={inputId}
          type="file"
          aria-invalid={error ? true : undefined}
          className={cn('sr-only', className)}
          onChange={(e) => {
            setFileName(e.target.files?.[0]?.name ?? null);
            onChange?.(e);
          }}
          {...props}
        />
        {hint && !error && <p className="font-sans text-xs text-ink-soft">{hint}</p>}
        {error && <p className="font-sans text-xs font-medium text-error">{error}</p>}
      </div>
    );
  },
);
FileInput.displayName = 'FileInput';
