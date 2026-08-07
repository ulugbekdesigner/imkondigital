import { cn } from './lib/cn';

export interface MatchScoreRingProps {
  value: number;
  size?: number;
  /** `deep` — dark bg-deep panellar ustida (oq matn); standart — oddiy paper fon. */
  surface?: 'paper' | 'deep';
}

/** Vakansiya moslik foizini doiraviy halqa sifatida ko'rsatadi. */
export function MatchScoreRing({ value, size = 44, surface = 'paper' }: MatchScoreRingProps) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100);
  const center = size / 2;
  const trackClass = surface === 'deep' ? 'stroke-deep-fg/20' : 'stroke-mint';
  const fillClass = surface === 'deep' ? 'stroke-bright' : 'stroke-primary';
  const labelClass = surface === 'deep' ? 'text-deep-fg' : 'text-ink';

  return (
    <div
      role="img"
      aria-label={`Moslik darajasi: ${value} foiz`}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={center} cy={center} r={radius} strokeWidth={stroke} fill="none" className={trackClass} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(fillClass, 'transition-[stroke-dashoffset] duration-slow motion-reduce:transition-none')}
        />
      </svg>
      <span aria-hidden="true" className={cn('absolute font-mono text-[0.65rem] font-bold', labelClass)}>
        {value}%
      </span>
    </div>
  );
}
