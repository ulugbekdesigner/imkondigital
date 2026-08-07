'use client';
/* ============================================================
   IMKON DIGITAL — Tabrik ekrani (5b-blok, "Harakat tizimi" 2-bo'lim).
   Konfetti yo'q: milliy naqsh (romb/doira) yuqoriga suzadi (rise-slow,
   bir marta, 2.2s). Har rol o'z karta uslubi + kirish harakatiga ega:
   o'quvchi — quyuq karta + check-pop, ustoz/ish beruvchi — yorug' karta
   + float-soft/ring-pulse, donor — brend-gradient karta. Barchasi
   prefers-reduced-motion'da statik holatga tushadi (globals.css'dagi
   umumiy qoida buni avtomatik qamrab oladi).
   ============================================================ */
import { useEffect, useRef } from 'react';
import { buttonVariants, cn } from '@imkon/ui';
import { CheckIcon, CloseIcon, HeartIcon, RouteIcon, UsersIcon } from '@/components/shell-icons';

export type CelebrationVariant = 'oquvchi' | 'ustoz' | 'ish-beruvchi' | 'donor';

interface CelebrationScreenProps {
  variant: CelebrationVariant;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onDismiss: () => void;
}

const VARIANT_META: Record<
  CelebrationVariant,
  { card: string; icon: typeof CheckIcon; iconWrap: string; iconAnim: string; ring: boolean }
> = {
  oquvchi: {
    card: 'bg-deep text-deep-fg',
    icon: CheckIcon,
    iconWrap: 'bg-deep-fg/10 text-deep-fg',
    iconAnim: 'animate-check-pop',
    ring: false,
  },
  ustoz: {
    card: 'bg-paper text-ink border border-line',
    icon: RouteIcon,
    iconWrap: 'bg-mint text-primary',
    iconAnim: 'animate-float-soft',
    ring: false,
  },
  'ish-beruvchi': {
    card: 'bg-paper text-ink border border-line',
    icon: UsersIcon,
    iconWrap: 'bg-mint text-primary',
    iconAnim: 'animate-float-soft',
    ring: true,
  },
  donor: {
    card: 'text-deep-fg',
    icon: HeartIcon,
    iconWrap: 'bg-white/15 text-deep-fg',
    iconAnim: 'animate-check-pop',
    ring: false,
  },
};

const DONOR_GRADIENT = { backgroundImage: 'linear-gradient(135deg, rgb(var(--imkon-bright)), rgb(var(--imkon-teal)))' };

function Particles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 overflow-hidden">
      <span className="absolute bottom-2 left-[18%] h-3 w-3 animate-rise-slow rounded-full bg-current opacity-0" />
      <span className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 animate-rise-slow bg-current opacity-0 [animation-delay:180ms]" />
      <span className="absolute bottom-3 right-[20%] h-2.5 w-2.5 animate-rise-slow rounded-full bg-current opacity-0 [animation-delay:340ms]" />
    </div>
  );
}

export function CelebrationScreen({
  variant,
  title,
  message,
  actionLabel,
  actionHref,
  onDismiss,
}: CelebrationScreenProps) {
  const meta = VARIANT_META[variant];
  const Icon = meta.icon;
  const dismissRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    dismissRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
      // left-0/top-0 + w-screen/h-dvh, inset-0 emas — html'dagi overflow-x:hidden
      // bilan birga Chromium ba'zan fixed elementni tozalanmagan kenglikka
      // nisbatan o'lchashi mumkin (w-screen doim haqiqiy viewportga bog'lanadi).
      className="fixed left-0 top-0 z-[200] flex h-dvh w-screen items-center justify-center p-4"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-ink/50" onClick={onDismiss} />
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-xl p-8 text-center shadow-xl ${meta.card}`}
        style={variant === 'donor' ? DONOR_GRADIENT : undefined}
      >
        <Particles />
        <button
          ref={dismissRef}
          type="button"
          onClick={onDismiss}
          aria-label="Yopish"
          className="absolute right-3 top-3 flex min-h-touch min-w-touch items-center justify-center rounded-full opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <CloseIcon width={16} height={16} />
        </button>
        <span className="relative mx-auto flex h-16 w-16 items-center justify-center">
          {meta.ring && (
            <span
              aria-hidden="true"
              className={`absolute inset-0 rounded-full ${meta.iconWrap} animate-ring-pulse motion-reduce:hidden`}
            />
          )}
          <span
            className={`relative flex h-16 w-16 items-center justify-center rounded-full ${meta.iconWrap} ${meta.iconAnim} motion-reduce:animate-none`}
          >
            <Icon width={30} height={30} />
          </span>
        </span>
        <h2 id="celebration-title" className="relative mt-5 font-display text-xl font-bold">
          {title}
        </h2>
        <p className="relative mt-2 text-base opacity-90">{message}</p>
        {actionLabel && actionHref && (
          <a
            href={actionHref}
            onClick={onDismiss}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'md' }),
              'relative mt-6 bg-paper px-6 text-sm text-ink',
            )}
          >
            {actionLabel}
          </a>
        )}
      </div>
    </div>
  );
}
