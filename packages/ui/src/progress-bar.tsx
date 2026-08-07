import { cn } from './lib/cn';

export interface ProgressBarProps {
  /** 0-100 oralig'ida — chaqiruvchi hisoblab beradi (masalan yig'ilgan/maqsad). */
  value: number;
  label: string;
  className?: string;
  /** "dark" — quyuq gradient fon ustida (masalan xayriya loyihasi gerosi); oq
   * to'ldiruvchi + shaffof oq izcha. Standart "light" — mavjud joylarda o'zgarmaydi. */
  surface?: 'light' | 'dark';
}

/** Jonli to'lib boruvchi progress-bar — xayriya loyihalari uchun (V2-2, B4-bo'lim). */
export function ProgressBar({ value, label, className, surface = 'light' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        'relative h-3 overflow-hidden rounded-full',
        surface === 'dark' ? 'bg-white/25' : 'bg-mint',
        className,
      )}
    >
      <div
        className={cn(
          'duration-slow h-full rounded-full transition-[width] motion-reduce:transition-none',
          surface === 'dark' ? 'bg-white' : 'bg-bright shadow-glow',
        )}
        style={{ width: `${pct}%` }}
      />
      <span
        aria-hidden="true"
        className={cn(
          'animate-sweep absolute inset-y-0 w-12 bg-gradient-to-r from-transparent to-transparent motion-reduce:hidden',
          surface === 'dark' ? 'via-white/50' : 'via-white/60',
        )}
      />
    </div>
  );
}
