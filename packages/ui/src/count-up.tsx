'use client';

import { useEffect, useRef, useState } from 'react';

export interface CountUpProps {
  /** Yakuniy son — DOM'da har doim shu yakuniy qiymat bo'ladi (ekran o'quvchisi to'g'ri o'qiydi). */
  value: number;
  /** Sonni formatlash — standart: mingliklarni ajratish (uz-UZ). */
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
}

const DEFAULT_FORMAT = (n: number) => Math.round(n).toLocaleString('uz-UZ');

/**
 * Statistika soni ko'ringanda 0'dan sanab chiqadi (V2 A5-bo'lim). Faqat bir
 * marta, ekranga kirganda (IntersectionObserver) ishga tushadi.
 * `prefers-reduced-motion` yoqilgan bo'lsa — animatsiyasiz, darhol yakuniy son.
 */
export function CountUp({ value, format = DEFAULT_FORMAT, durationMs = 1200, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el || started) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setStarted(true);
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min(1, (now - start) / durationMs);
          const eased = 1 - (1 - progress) ** 3; // ease-out cubic
          setDisplay(value * eased);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs, started]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
