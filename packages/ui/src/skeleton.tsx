import type { HTMLAttributes } from 'react';
import { cn } from './lib/cn';

/**
 * Yuklanish o'rniga ko'rsatiladigan shimmer-blok — hech qachon bo'sh oq ekran
 * bo'lmasin (V2 A5-bo'lim). O'zi dekorativ (`aria-hidden`) — bir nechta
 * Skeleton'ni birlashtirganda, o'rab turuvchi konteynerga
 * `role="status" aria-label="Yuklanmoqda…"` qo'shing.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded bg-mint motion-reduce:animate-none',
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-paper/60 to-transparent motion-reduce:hidden" />
    </div>
  );
}
