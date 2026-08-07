'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@imkon/ui';

/** Global (haqiqiy, real backend'li) ZiyoWidget'ni ochadi — GlobalSearch bilan bir xil hodisa. */
export function OpenZiyoLink({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('imkon:ask-ziyo', { detail: {} }))}
      className={cn('focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', className)}
      style={style}
    >
      {children}
    </button>
  );
}
