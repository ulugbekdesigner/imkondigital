'use client';
/* ============================================================
   IMKON DIGITAL — O'tkinchi bildirishnoma (5b-blok, "Harakat tizimi"
   1-bo'lim). Kirish 420ms toastIn, 5s dan keyin o'zi yopiladi (yoki
   qo'lda yopish tugmasi bilan), reduced-motion'da statik (globals.css
   dagi umumiy qoida buni avtomatik qamrab oladi, bu yerda qo'shimcha
   motion-reduce: bilan ikki qatlamli himoya — celebration-screen.tsx
   bilan bir xil andoza).
   ============================================================ */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AlertIcon, BellIcon, CheckIcon, CloseIcon, RefreshIcon, SparkIcon } from '@/components/shell-icons';

export type ToastVariant = 'success' | 'message' | 'opportunity' | 'system' | 'error';

export interface ToastInput {
  variant: ToastVariant;
  title: string;
  body?: string;
}

interface ToastEntry extends ToastInput {
  id: number;
}

const AUTO_DISMISS_MS = 5000;
let nextToastId = 1;

const VARIANT_META: Record<
  ToastVariant,
  { card: string; iconWrap: string; icon: typeof CheckIcon; iconAnim: string }
> = {
  success: {
    card: 'border-success bg-paper text-ink',
    iconWrap: 'bg-success text-success-fg',
    icon: CheckIcon,
    iconAnim: 'animate-check-pop motion-reduce:animate-none',
  },
  message: {
    card: 'border-line bg-paper text-ink',
    iconWrap: 'bg-info-bg text-info',
    icon: BellIcon,
    iconAnim: '',
  },
  opportunity: {
    card: 'border-line bg-paper text-ink',
    iconWrap: 'bg-warn-bg text-warn',
    icon: SparkIcon,
    iconAnim: '',
  },
  system: {
    card: 'border-transparent bg-deep text-deep-fg',
    iconWrap: 'bg-deep-fg/15 text-teal',
    icon: RefreshIcon,
    iconAnim: '',
  },
  error: {
    card: 'border-error bg-paper text-ink',
    iconWrap: 'bg-error-bg text-error',
    icon: AlertIcon,
    iconAnim: '',
  },
};

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = nextToastId++;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-[var(--z-toast)] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:top-[calc(var(--h-topbar)+12px)]"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastEntry;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // onDismiss (=`dismiss`) is stable (useCallback, no deps); toast.id is stable
    // for the lifetime of this toast — depending on the whole `toast` object would
    // re-arm the timer whenever a SIBLING toast is added/removed, since the parent
    // re-renders and `toasts` is a new array (even though this entry is unchanged).
  }, [onDismiss, toast.id]);

  const meta = VARIANT_META[toast.variant];
  const Icon = meta.icon;

  return (
    <div
      className={`animate-toast-in shadow-glass pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-2xl border p-4 motion-reduce:animate-none ${meta.card}`}
    >
      {toast.variant === 'system' && (
        <span
          aria-hidden="true"
          className="animate-sweep absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/15 to-transparent motion-reduce:hidden"
        />
      )}
      <span
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.iconWrap} ${meta.iconAnim}`}
      >
        <Icon width={18} height={18} aria-hidden="true" />
        {toast.variant === 'message' && (
          <span
            aria-hidden="true"
            className="animate-dot-pulse border-paper bg-error absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 motion-reduce:animate-none"
          />
        )}
      </span>
      <div className="relative min-w-0 flex-1">
        <p className="truncate font-sans text-base font-semibold">{toast.title}</p>
        {toast.body && <p className="truncate font-sans text-sm opacity-80">{toast.body}</p>}
      </div>
      {toast.variant === 'opportunity' && (
        <span className="animate-fade-up bg-primary text-primary-fg relative shrink-0 rounded-full px-2.5 py-1 font-sans text-xs font-bold motion-reduce:animate-none">
          Yangi
        </span>
      )}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Bildirishnomani yopish"
        className="min-h-touch min-w-touch focus-visible:ring-focus relative flex shrink-0 items-center justify-center rounded-full opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2"
      >
        <CloseIcon width={14} height={14} />
      </button>
    </div>
  );
}

export function useToast(): (toast: ToastInput) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast — ToastProvider ichida chaqirilishi kerak');
  return ctx;
}
