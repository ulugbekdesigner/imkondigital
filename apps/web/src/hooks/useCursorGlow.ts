'use client';

import { useEffect } from 'react';

/**
 * Har `.imk-section`ning birinchi bolasi sifatida qo'yilgan `.imk-glow`
 * elementini kursor ortidan yumshoq (lerp) harakatlantiradi — faqat
 * o'sha bo'lim ichida sichqoncha bo'lganda ko'rinadi.
 */
export function useCursorGlow(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const state = {
      x: 0,
      y: 0,
      seen: false,
      pos: new WeakMap<Element, { x: number; y: number }>(),
    };
    const onMove = (e: MouseEvent) => {
      state.x = e.clientX;
      state.y = e.clientY;
      state.seen = true;
    };
    let raf = 0;
    const tick = () => {
      if (state.seen) {
        document.querySelectorAll<HTMLElement>('.imk-glow').forEach((glow) => {
          const host = glow.parentElement?.getBoundingClientRect();
          if (!host) return;
          const tx = state.x - host.left;
          const ty = state.y - host.top;
          const p = state.pos.get(glow) ?? { x: tx, y: ty };
          p.x += (tx - p.x) * 0.12;
          p.y += (ty - p.y) * 0.12;
          state.pos.set(glow, p);
          glow.style.translate = `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`;
          const inside =
            state.x >= host.left && state.x <= host.right && state.y >= host.top && state.y <= host.bottom;
          glow.style.opacity = inside ? '1' : '0';
        });
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);
}
