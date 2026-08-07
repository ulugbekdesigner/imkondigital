'use client';

import { useEffect, useState } from 'react';
import { ContrastIcon, MoonIcon, SunIcon } from './shell-icons';

type Theme = 'oq' | 'tun' | 'kontrast';
type FontScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: 'oq', label: "Yorug'", icon: SunIcon },
  { value: 'tun', label: 'Tungi', icon: MoonIcon },
  { value: 'kontrast', label: 'Yuqori kontrast', icon: ContrastIcon },
];

// 5 bosqich — A−/A+ har bosishda BITTA bosqichga siljiydi. Avval faqat 3
// qat'iy qiymat bo'lib, tugmalar "shu qiymatga o'rnat" edi — A+ bir marta
// "lg"ga sakragach yana bosish hech narsa qilmasdi (foydalanuvchi "bir
// marta kattalashib, keyin to'xtab qolyapti" deb shikoyat qildi).
const FONT_LEVELS: FontScale[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const FONT_LEVEL_LABELS: Record<FontScale, string> = {
  xs: 'juda kichik',
  sm: 'kichik',
  md: "o'rta",
  lg: 'katta',
  xl: 'juda katta',
};

function readAttr<T extends string>(name: string, fallback: T): T {
  if (typeof document === 'undefined') return fallback;
  return (document.documentElement.getAttribute(name) as T) ?? fallback;
}

/**
 * Header'da doimiy accessibility boshqaruvi (2.4-bo'lim):
 * rang rejimi, yuqori kontrast, font o'lchovi. Sozlamalar localStorage'da saqlanadi.
 */
export function AccessibilityBar() {
  const [theme, setTheme] = useState<Theme>('oq');
  const [fontScale, setFontScale] = useState<FontScale>('md');

  // Init skript o'rnatgan holatni komponentga o'qiymiz
  useEffect(() => {
    setTheme(readAttr('data-theme', 'oq'));
    setFontScale(readAttr('data-font-scale', 'md'));
  }, []);

  function apply(attr: string, storageKey: string, value: string) {
    document.documentElement.setAttribute(attr, value);
    localStorage.setItem(storageKey, value);
  }

  function chooseTheme(next: Theme) {
    setTheme(next);
    apply('data-theme', 'imkon-theme', next);
  }

  function changeFont(next: FontScale) {
    setFontScale(next);
    apply('data-font-scale', 'imkon-font-scale', next);
  }

  function stepFont(delta: 1 | -1) {
    const idx = FONT_LEVELS.indexOf(fontScale);
    const clamped = Math.min(FONT_LEVELS.length - 1, Math.max(0, idx + delta));
    changeFont(FONT_LEVELS[clamped] ?? fontScale);
  }

  const btn =
    'min-h-touch min-w-touch inline-flex items-center justify-center rounded border border-line px-3 font-sans text-base text-ink hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper';

  return (
    <div
      role="toolbar"
      aria-label="Ko'rish sozlamalari"
      data-tour="accessibility-panel"
      className="flex flex-wrap items-center justify-end gap-2 border-b border-line bg-paper px-4 py-2"
    >
      <div className="flex items-center gap-1" role="group" aria-label="Ko'rinish rejimi">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => chooseTheme(value)}
            className={`${btn} ${theme === value ? 'bg-primary text-primary-fg' : ''}`}
            aria-pressed={theme === value}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1" role="group" aria-label="Matn o'lchovi">
        <button
          type="button"
          onClick={() => stepFont(-1)}
          className={btn}
          disabled={fontScale === FONT_LEVELS[0]}
          aria-label="Matnni kichiklashtirish"
        >
          <span aria-hidden="true">A−</span>
        </button>
        <button
          type="button"
          onClick={() => changeFont('md')}
          className={`${btn} ${fontScale === 'md' ? 'bg-primary text-primary-fg' : ''}`}
          aria-pressed={fontScale === 'md'}
          aria-label={`Matn o'lchovini asl holatga qaytarish (hozir: ${FONT_LEVEL_LABELS[fontScale]})`}
        >
          <span aria-hidden="true">A</span>
        </button>
        <button
          type="button"
          onClick={() => stepFont(1)}
          className={btn}
          disabled={fontScale === FONT_LEVELS[FONT_LEVELS.length - 1]}
          aria-label="Matnni kattalashtirish"
        >
          <span aria-hidden="true">A+</span>
        </button>
      </div>
    </div>
  );
}
