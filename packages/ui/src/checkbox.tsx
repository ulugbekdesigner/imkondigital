'use client';

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Ko'rinadigan yorliq — checkbox har doim matn bilan birga keladi. */
  label: ReactNode;
}

/* IMKON Interface.dc.html 4b-blok ("Belgilash") — 22×22px, radius 7px,
   belgilanganda bg-bright + oq belgi. Asl <input type="checkbox"> vizual
   jihatdan yashiringan (sr-only), klaviatura/skrin-o'quvchi uchun saqlanadi;
   ko'rinadigan kvadrat shu inputning "peer" holatiga qarab stillanadi. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, disabled, ...props }, ref) => {
    const autoId = useId();
    const checkboxId = id ?? autoId;
    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'inline-flex cursor-pointer items-center gap-2.5 font-sans text-base text-ink',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] border-line bg-paper text-white [&>svg]:opacity-0',
            'peer-checked:border-bright peer-checked:bg-bright peer-checked:[&>svg]:opacity-100',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper',
            className,
          )}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 10.5 8 15l8-9.5" />
          </svg>
        </span>
        {label}
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';
