'use client';

import { useEffect, useState } from 'react';
import { cn } from '@imkon/ui';

/** Ikkita real, saqlanadigan sozlama — AccessibilityBar bilan bir xil
 * mexanizm (localStorage + data-* atribut, CSS shu atributlarni o'qiydi).
 * "Ekran o'quvchi rejimi"/"Subtitr sukut bo'yicha" spec'da bor, lekin bunday
 * sozlamaga bog'liq HECH QANDAY real xatti-harakat yo'q — shu sabab
 * qo'shilmadi (ishlamaydigan tugma qo'yish o'rniga faqat ishlaydiganini). */
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-sans text-sm text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <span
          className={cn(
            'flex h-[26px] w-[46px] items-center rounded-full p-[3px] transition-colors motion-reduce:transition-none',
            checked ? 'justify-end bg-bright' : 'justify-start bg-surface-2',
          )}
        >
          <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
        </span>
      </button>
    </div>
  );
}

export function AccessibilitySettingsCard() {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setHighContrast(document.documentElement.getAttribute('data-theme') === 'kontrast');
    setReducedMotion(document.documentElement.getAttribute('data-motion') === 'reduced');
  }, []);

  /* Kontrastni yoqishdan oldingi mavzuni ("oq"/"tun") eslab qolamiz — aks
   * holda "tun" tanlangan foydalanuvchi kontrastni yoqib-o'chirsa "oq"ga
   * qaytib qolardi (data-theme endi BITTA atribut, kontrast ham shu
   * qiymatlardan biri, alohida data-contrast qatlami yo'q). */
  function toggleContrast(next: boolean) {
    setHighContrast(next);
    if (next) {
      const current = document.documentElement.getAttribute('data-theme');
      localStorage.setItem('imkon-theme-before-kontrast', current === 'kontrast' ? 'oq' : (current ?? 'oq'));
      document.documentElement.setAttribute('data-theme', 'kontrast');
      localStorage.setItem('imkon-theme', 'kontrast');
    } else {
      const restore = localStorage.getItem('imkon-theme-before-kontrast') ?? 'oq';
      document.documentElement.setAttribute('data-theme', restore);
      localStorage.setItem('imkon-theme', restore);
      localStorage.removeItem('imkon-theme-before-kontrast');
    }
  }

  function toggleMotion(next: boolean) {
    setReducedMotion(next);
    const value = next ? 'reduced' : 'normal';
    document.documentElement.setAttribute('data-motion', value);
    localStorage.setItem('imkon-motion', value);
  }

  return (
    <div className="flex flex-col gap-3.5">
      <Toggle label="Yuqori kontrast" checked={highContrast} onChange={toggleContrast} />
      <Toggle label="Animatsiyani kamaytirish" checked={reducedMotion} onChange={toggleMotion} />
    </div>
  );
}
