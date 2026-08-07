import { cn } from './lib/cn';

/**
 * Nozik girih (geometrik islimiy) chizgisi — sahifa bo'lim ajratkichi
 * (V2 A3-bo'lim: "ozgina va nafis" milliylik qoidasi). Sof CSS panjara
 * (SVG emas — id-to'qnashuv xavfisiz, bir sahifada bir necha marta
 * ishlatsa ham xavfsiz). Sof dekorativ, ekran o'quvchisidan yashirilgan.
 */
export function GirihDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      // `className` orqali matn rangi (text-ink, text-deep-fg va h.k.) beriladi —
      // gradient shu rangni `currentColor` orqali oladi, fon kontekstiga moslanadi.
      className={cn('h-10 w-full text-ink opacity-[0.06]', className)}
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 20px), ' +
          'repeating-linear-gradient(-45deg, currentColor 0 1px, transparent 1px 20px)',
      }}
    />
  );
}
