'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FADE_UP_ITEM, STAGGER_CONTAINER, STATIC_ITEM } from '@/lib/motion';

/** Bolalarni bir-birin-ketin (stagger) pastdan suzib chiqaradigan konteyner.
 * `as` — semantik teg (masalan `ol`/`ul`) kerak bo'lganda, standart `div`. */
export function RevealGroup({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'ol' | 'ul';
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];
  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={reduce ? undefined : STAGGER_CONTAINER}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li';
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];
  return (
    <MotionTag variants={reduce ? STATIC_ITEM : FADE_UP_ITEM} className={className}>
      {children}
    </MotionTag>
  );
}
