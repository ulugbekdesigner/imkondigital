import type { HTMLAttributes } from 'react';
import { cn } from './lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('shadow-card-md rounded-[18px] border border-line bg-paper p-6', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1.5', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  // Kontent har doim `children` orqali beriladi (dizayn-tizim wrapper'i) —
  // shu sabab heading-has-content statik tekshiruvni bu yerda o'chiramiz.
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return <h3 className={cn('font-display text-lg font-semibold text-ink', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('font-sans text-base text-ink-soft', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('font-sans text-base text-ink', className)} {...props} />;
}
