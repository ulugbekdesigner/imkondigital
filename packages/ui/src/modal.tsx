'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Button, type ButtonProps } from './button';
import { cn } from './lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}

/* IMKON Interface.dc.html 4b-blok ("Tasdiqlash oynasi") — 16px radius,
   card-lg soya (modal/drawer zinapoyasi). Escape va fondan tashqariga
   bosish bilan yopiladi, yopilgach fokus sababchi elementga qaytadi —
   ziyo-widget.tsx panelidagi bilan bir xil andoza. */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      panelRef.current?.focus();
    } else if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-ink/30"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="imk-modal-title"
        tabIndex={-1}
        className={cn(
          'shadow-card-lg relative flex w-full max-w-sm flex-col gap-2.5 rounded-2xl border border-line bg-paper p-[18px] focus:outline-none',
          className,
        )}
      >
        <span id="imk-modal-title" className="font-sans text-lg font-bold text-ink">
          {title}
        </span>
        {children}
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Arxivlash/o'chirish kabi qaytarib bo'lmas/og'ir amallar uchun qizil tugma. */
  destructive?: boolean;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
}

/** Buzg'unchi (yoki qaytarilishi og'ir) amallardan oldin tasdiq so'raydigan modal. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Tasdiqlash',
  cancelLabel = 'Bekor',
  destructive = false,
  confirmDisabled = false,
  confirmLoading = false,
}: ConfirmDialogProps) {
  const confirmVariant: ButtonProps['variant'] = destructive ? 'danger' : 'primary';
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {description && <p className="font-sans text-sm text-ink-soft">{description}</p>}
      <div className="mt-1 flex gap-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={confirmLoading}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          className="flex-1"
          disabled={confirmDisabled}
          isLoading={confirmLoading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
