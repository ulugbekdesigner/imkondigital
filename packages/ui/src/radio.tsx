'use client';

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Ko'rinadigan yorliq — radio har doim matn bilan birga keladi. */
  label: ReactNode;
}

/* IMKON Interface.dc.html 4b-blok ("Bitta tanlov") — 22×22px doira,
   tanlanganda border-bright + o'rtada 11px to'ldirilgan nuqta. Asl
   <input type="radio"> vizual jihatdan yashiringan (sr-only), klaviatura/
   skrin-o'quvchi uchun saqlanadi; Checkbox bilan bir xil "peer" andozasi. */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, disabled, ...props }, ref) => {
    const autoId = useId();
    const radioId = id ?? autoId;
    return (
      <label
        htmlFor={radioId}
        className={cn(
          'inline-flex cursor-pointer items-center gap-2.5 font-sans text-base text-ink',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <input
          ref={ref}
          id={radioId}
          type="radio"
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-line [&>span]:scale-0',
            'peer-checked:border-bright peer-checked:[&>span]:scale-100',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper',
            className,
          )}
        >
          <span className="h-[11px] w-[11px] rounded-full bg-bright transition-transform motion-reduce:transition-none" />
        </span>
        {label}
      </label>
    );
  },
);
Radio.displayName = 'Radio';
