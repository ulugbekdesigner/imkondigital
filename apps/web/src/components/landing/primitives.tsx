import type { ReactNode } from 'react';

type Tone = 'dark' | 'light' | 'brand';

export function LandingSection({
  tone = 'dark',
  reveal = true,
  children,
  className = '',
  ariaLabelledby,
}: {
  tone?: Tone;
  reveal?: boolean;
  children: ReactNode;
  className?: string;
  ariaLabelledby?: string;
}) {
  return (
    <section
      data-reveal={reveal ? '1' : undefined}
      aria-labelledby={ariaLabelledby}
      className={`imk-section imk-section--${tone} ${className}`}
    >
      {children}
    </section>
  );
}

export function LandingCard({
  label,
  title,
  children,
  footer,
  className = '',
}: {
  label?: string;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article className={`imk-card ${className}`}>
      {label && <span className="imk-card__label">{label}</span>}
      {title && <h3 className="imk-card__title">{title}</h3>}
      {children && <p className="imk-card__body">{children}</p>}
      {footer && <div style={{ marginTop: 'auto' }}>{footer}</div>}
    </article>
  );
}

export function LandingGlass({
  children,
  className = '',
  as: As = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article';
}) {
  return <As className={`imk-glass ${className}`}>{children}</As>;
}

/** Kursor-nuri joyi — bo'limning BIRINCHI bolasi sifatida qo'yiladi. */
export function CursorGlow({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return <div aria-hidden="true" className={`imk-glow imk-glow--${tone}`} />;
}

export function Ornament({
  variant,
  className = '',
  depth,
}: {
  variant: 'star' | 'lattice' | 'medallion' | 'seam' | 'arch-crown' | 'arch-legs';
  className?: string;
  depth?: number;
}) {
  return (
    <div
      aria-hidden="true"
      data-depth={depth}
      className={`imk-orn imk-orn--${variant} ${className}`}
    />
  );
}
