'use client';

import { useEffect } from 'react';
import { useCursorGlow } from '@/hooks/useCursorGlow';
import { useParallaxBlobs } from '@/hooks/useParallaxBlobs';
import { useReveal } from '@/hooks/useReveal';

/** Umumiy (butun saytdagi) PublicHeader'ni shu sahifada Robot Aurora uslubiga o'tkazadi. */
function useLandingHeaderTheme(): void {
  useEffect(() => {
    document.documentElement.dataset.landingHeader = '1';
    return () => {
      delete document.documentElement.dataset.landingHeader;
    };
  }, []);
}

/** Bosh sahifadagi barcha `.imk-glow`/`[data-depth]`/`[data-reveal]` elementlarni jonlantiradi. */
export function LandingEffects() {
  useLandingHeaderTheme();
  useCursorGlow();
  useParallaxBlobs();
  useReveal();
  return null;
}
