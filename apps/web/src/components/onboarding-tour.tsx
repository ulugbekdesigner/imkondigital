'use client';
/* ============================================================
   IMKON DIGITAL — Birinchi kirish tanishtiruvi (4l-blok).
   AppShell ichida bir marta (localStorage bilan) ko'rsatiladi:
   1) Chapdagi menyu, 2) Bugungi vazifa (agar joriy sahifada bo'lsa —
   aks holda AVTOMATIK O'TKAZIB YUBORILADI, xato bermaydi),
   3) Qulaylik paneli, 4) ZIYO. Klaviatura bilan to'liq boshqariladi
   (Tab ikkita tugma orasida ushlab turiladi, Esc — butun turni
   yopadi), prefers-reduced-motion'da o'tish animatsiyasiz.
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@/components/shell-icons';

const STORAGE_KEY = 'imkon-onboarding-done';

interface Step {
  target: string; // data-tour qiymati
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    target: 'sidebar-nav',
    title: "Asosiy menyu — sizning yo'lingiz",
    body: "“Yo'lim” — bugungi vazifa, “O'qish” — kurslar, “Ish” — vakansiyalar. Istalgan paytda qaytishingiz mumkin.",
  },
  {
    target: 'today-task',
    title: 'Bugungi vazifa',
    body: "Har safar kirganingizda shu yerda keyingi qadamingiz — davom etayotgan dars yoki tavsiya — kutib turadi.",
  },
  {
    target: 'accessibility-panel',
    title: 'Qulaylik paneli',
    body: "Tema, kontrast va matn o'lchovini shu yerdan sozlaysiz — tanlovingiz saqlanib qoladi.",
  },
  {
    target: 'ziyo-trigger',
    title: 'ZIYO',
    body: "AI yordamchi har doim pastki burchakda — savolingiz bo'lsa, shu tugmani bosing.",
  },
];

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function findRect(target: string): Rect | null {
  // Ba'zi nishonlar breakpoint bo'yicha ikkita joyda bo'ladi (masalan
  // "sidebar-nav" — desktop aside + mobil bottomnav); CSS qaysi birini
  // yashirsa, o'shani (0x0) o'tkazib, KO'RINADIGANINI tanlaymiz.
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);
  for (const el of candidates) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 || r.height > 0) {
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    }
  }
  return null;
}

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Harakat kamaytirilganda ham tur ko'rsatiladi, faqat animatsiyasiz —
      // umuman ko'rsatmaslik foydalanuvchini birinchi marta yo'naltirishdan mahrum qiladi.
    }
    const timer = window.setTimeout(() => setVisible(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  // Joriy qadamning nishonini top — topilmasa avtomatik keyingisiga o'tadi.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let attempts = 0;
    const tryFind = () => {
      if (cancelled) return;
      const currentStep = STEPS[stepIndex];
      if (!currentStep) return;
      const r = findRect(currentStep.target);
      if (r) {
        setRect(r);
        return;
      }
      attempts += 1;
      if (attempts > 6) {
        // 6 marta (≈600ms) urinib topilmasa — bu qadam sahifada yo'q, o'tkazib yuboramiz.
        if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
        else finish();
        return;
      }
      window.setTimeout(tryFind, 100);
    };
    tryFind();
    return () => {
      cancelled = true;
    };
  }, [visible, stepIndex]);

  useEffect(() => {
    if (!rect) return;
    const onResize = () => {
      const currentStep = STEPS[stepIndex];
      if (currentStep) setRect(findRect(currentStep.target));
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onResize, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [rect, stepIndex]);

  useEffect(() => {
    if (rect) nextRef.current?.focus();
  }, [rect]);

  function finish() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* localStorage yo'q bo'lsa ham turni yopish yetarli */
    }
  }

  function next() {
    if (stepIndex < STEPS.length - 1) {
      setRect(null);
      setStepIndex((i) => i + 1);
    } else {
      finish();
    }
  }

  // Esc — turni yopadi, Tab — ikkita tugma (Skip/Keyingi) orasida ushlab
  // turiladi. Codebase konvensiyasiga ko'ra document-darajasida ulanadi
  // (JSX onKeyDown ga qaraganda — bu esa jsx-a11y non-interactive qoidasiga tegmaydi).
  useEffect(() => {
    if (!visible || !rect) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = cardRef.current?.querySelectorAll<HTMLElement>('button');
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [visible, rect]);

  const step = STEPS[stepIndex];
  if (!visible || !rect || !step) return null;

  const pad = 8;
  const spotlight: Rect = {
    left: rect.left - pad,
    top: rect.top - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const openUpward = spotlight.top > vh * 0.6;
  const cardTop = openUpward ? undefined : Math.min(spotlight.top + spotlight.height + 14, vh - 220);
  const cardBottom = openUpward ? vh - spotlight.top + 14 : undefined;
  const cardLeft = Math.min(Math.max(spotlight.left, 16), vw - 356);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      // left-0/top-0 + w-screen/h-dvh, inset-0 emas — html'dagi overflow-x:hidden
      // bilan birga Chromium ba'zan fixed elementni tozalanmagan kenglikka
      // nisbatan o'lchashi mumkin (w-screen doim haqiqiy viewportga bog'lanadi).
      className="fixed left-0 top-0 z-[200] h-dvh w-screen"
    >
      {/* Spotlight: kichik "teshik" div — o'z box-shadow'i BUTUN ekranni
          xiralashtiradi, faqat o'zining maydoni ochiq qoladi (klassik
          "cutout" texnikasi, SVG mask'siz). Joylashuv nishonga qarab
          dinamik hisoblangani uchun inline (token bo'lmagan qiymatlar emas). */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed rounded-lg border-2 transition-[left,top,width,height] duration-300 ease-out motion-reduce:transition-none"
        style={{
          left: spotlight.left,
          top: spotlight.top,
          width: spotlight.width,
          height: spotlight.height,
          // Semantik --ink token (rgb triplet) — uchala mavzuda (oq/tun/kontrast)
          // to'g'ri qorong'ilashadi, qattiq navy hex emas.
          boxShadow: '0 0 0 9999px rgb(var(--ink) / 0.6)',
          borderColor: 'rgb(var(--imkon-teal))',
        }}
      />
      <div
        ref={cardRef}
        className="fixed flex w-[340px] max-w-[calc(100vw-32px)] flex-col gap-3 rounded-xl border border-line bg-paper p-5 shadow-xl"
        style={{ left: cardLeft, top: cardTop, bottom: cardBottom }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
            {stepIndex + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={finish}
            aria-label="Tanishtiruvni o'tkazib yuborish"
            className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-ink-soft hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        <h2 id="onboarding-title" className="m-0 text-md font-bold text-ink">
          {step.title}
        </h2>
        <p className="m-0 text-base leading-relaxed text-ink-soft">{step.body}</p>
        <div className="mt-1 flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s.target}
                aria-hidden="true"
                className={
                  i === stepIndex
                    ? 'h-1.5 w-5 rounded-full bg-primary transition-all'
                    : 'h-1.5 w-1.5 rounded-full bg-line transition-all'
                }
              />
            ))}
          </div>
          <button
            ref={nextRef}
            type="button"
            onClick={next}
            className="ml-auto flex min-h-touch items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            {stepIndex < STEPS.length - 1 ? 'Keyingisi' : 'Tugatish'}
          </button>
        </div>
      </div>
    </div>
  );
}
