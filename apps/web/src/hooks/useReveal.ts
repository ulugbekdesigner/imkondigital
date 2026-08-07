'use client';

import { useEffect } from 'react';

/**
 * `[data-reveal]` bo'limlarni scroll bilan yumshoq chiqaradi (opacity+translateY).
 * Diqqat: birinchi tekshiruv layout o'rnashgach (~450ms) ishga tushadi — aks
 * holda hammasi bir vaqtda "ochilib" qolishi mumkin.
 */
export function useReveal(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (els.length === 0) return;

    els.forEach((el) => {
      el.style.transition =
        'opacity 900ms cubic-bezier(.2,.7,.2,1), translate 900ms cubic-bezier(.2,.7,.2,1)';
      el.style.opacity = '0';
      el.style.translate = '0 36px';
    });

    const show = (el: HTMLElement) => {
      el.style.opacity = '1';
      el.style.translate = '0 0';
    };
    const check = () => {
      const vh = window.innerHeight;
      els.forEach((el) => {
        if (el.style.opacity === '1') return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.88 && r.bottom > vh * 0.06) show(el);
      });
      const de = document.documentElement;
      if (window.scrollY + vh >= de.scrollHeight - 8) els.forEach(show);
    };

    let armed = false;
    const timer = window.setTimeout(() => {
      armed = true;
      requestAnimationFrame(() => requestAnimationFrame(check));
    }, 450);
    const onScroll = () => { if (armed) check(); };
    const onResize = () => { if (armed) check(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);
}
