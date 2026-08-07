'use client';

import { useEffect } from 'react';

/**
 * `[data-depth]` elementlarni (`.imk-blob`) kursor va scroll asosida
 * parallaks bilan harakatlantiradi — chuqurlik (`data-depth`) qancha
 * katta bo'lsa, shuncha tez.
 */
export function useParallaxBlobs(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const t = { mx: 0, my: 0, cx: 0, cy: 0, sy: 0, csy: 0 };
    const onMove = (e: MouseEvent) => {
      t.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      t.my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      t.sy = window.scrollY;
    };
    let raf = 0;
    const tick = () => {
      t.cx += (t.mx - t.cx) * 0.055;
      t.cy += (t.my - t.cy) * 0.055;
      t.csy += (t.sy - t.csy) * 0.08;
      document.querySelectorAll<HTMLElement>('[data-depth]').forEach((el) => {
        const d = Number(el.dataset.depth) || 1;
        const k = 70 + d * 38;
        el.style.translate = `${(t.cx * k).toFixed(1)}px ${(t.cy * k * 0.65 - t.csy * 0.07 * d).toFixed(1)}px`;
      });
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
}
