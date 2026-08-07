import type { Variants } from 'framer-motion';

/**
 * Umumiy Framer Motion variantlari (V2 A5-bo'lim: "Jonli platforma").
 * Framer Motion o'zi `prefers-reduced-motion`ni avtomatik hurmat qilmaydi —
 * shu sabab har bir animatsiyalangan komponent `useReducedMotion()` (framer-motion'dan)
 * bilan tekshirib, kamaytirilgan holatda variantlarni statik holatga tushiradi.
 */

export const STAGGER_CONTAINER: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const FADE_UP_ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Reduced-motion holatida stagger/fade o'rniga darhol ko'rinadigan variant. */
export const STATIC_ITEM: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};
