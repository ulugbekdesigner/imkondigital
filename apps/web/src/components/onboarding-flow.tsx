'use client';
/* ============================================================
   IMKON DIGITAL — Ro'yxatdan o'tish (4c-blok, "Ro'yxatdan o'tish" yarmi).
   Faqat 2-bosqich (Qiziqishlar) uchun aniq piksel spec berilgan — shu
   sabab uning naqshi (bosqich-narvoni, oq karta, pastki navigatsiya qatori)
   qolgan 3 bosqichga ham izchil qo'llanadi. Haqiqiy backend logikasi
   (ro'yxatdan o'tish/tasdiqlash/tavsiya so'rovlari) o'zgarishsiz qoldi —
   faqat taqdimot qayta qurildi.
   ============================================================ */
import { type ComponentProps, type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button, Input, buttonVariants, cn } from '@imkon/ui';
import { ArrowLeftIcon, CheckIcon, ChevronRightIcon } from '@/components/shell-icons';
import { COURSE_CATEGORIES } from '@/lib/course-categories';
import { formatThousands } from '@/lib/format';
import type { CourseCard } from '@/lib/types';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: 'Hisob',
  2: 'Qiziqishlar',
  3: 'Tasdiqlash',
  4: 'Tayyor',
};

const MAX_INTERESTS = 3;

function extractError(data: unknown): string {
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0] && typeof detail[0] === 'object' && 'msg' in detail[0]) {
      return String((detail[0] as { msg: unknown }).msg);
    }
  }
  return "Xatolik yuz berdi. Qaytadan urinib ko'ring.";
}

function ProgressLadder({ step }: { step: Step }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={4}
      aria-label="Ro'yxatdan o'tish progressi"
      className="flex items-center gap-2.5"
    >
      {([1, 2, 3, 4] as const).map((n) => {
        const state = n < step ? 'done' : n === step ? 'current' : 'locked';
        return (
          <div
            key={n}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex flex-1 flex-col gap-1.5"
          >
            <div className={cn('h-1.5 rounded-full', state === 'locked' ? 'bg-surface-2' : 'bg-bright')} />
            <span
              className={cn(
                'font-sans text-xs',
                state === 'locked' ? 'text-ink-soft' : state === 'current' ? 'font-bold text-ink' : 'font-semibold text-ink',
              )}
            >
              {STEP_LABELS[n]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CategoryGrid({
  interests,
  onToggle,
}: {
  interests: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div role="group" aria-label="Qiziqish yo'nalishlari" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {COURSE_CATEGORIES.map((c) => {
        const selected = interests.includes(c.key);
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onToggle(c.key)}
            aria-pressed={selected}
            className={cn(
              'flex items-start gap-3 rounded-lg p-4 text-left transition-colors motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
              selected ? 'border-[1.5px] border-bright bg-bright/10' : 'border border-line bg-paper hover:bg-surface-2',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                selected ? 'bg-bright text-white' : 'border-[1.5px] border-line',
              )}
            >
              {selected && <CheckIcon width={13} height={13} />}
            </span>
            <span className="flex flex-col">
              <span className="font-sans text-base font-bold text-ink">{c.title}</span>
              <span className="font-sans text-xs text-ink-soft">
                {c.step}-pog'ona · {c.examples[0]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AccessPrefsRow() {
  const [contrast, setContrast] = useState<'normal' | 'high'>('normal');
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');

  useEffect(() => {
    const html = document.documentElement;
    setContrast(html.getAttribute('data-theme') === 'kontrast' ? 'high' : 'normal');
    setFontScale((html.getAttribute('data-font-scale') as 'sm' | 'md' | 'lg') ?? 'md');
  }, []);

  function toggleContrast() {
    const next = contrast === 'high' ? 'normal' : 'high';
    let theme: string;
    if (next === 'high') {
      const current = document.documentElement.getAttribute('data-theme');
      localStorage.setItem('imkon-theme-before-kontrast', current === 'kontrast' ? 'oq' : (current ?? 'oq'));
      theme = 'kontrast';
    } else {
      theme = localStorage.getItem('imkon-theme-before-kontrast') ?? 'oq';
      localStorage.removeItem('imkon-theme-before-kontrast');
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('imkon-theme', theme);
    setContrast(next);
  }

  function toggleFontScale() {
    const next = fontScale === 'lg' ? 'md' : 'lg';
    document.documentElement.setAttribute('data-font-scale', next);
    localStorage.setItem('imkon-font-scale', next);
    setFontScale(next);
  }

  const chipActive = cn(buttonVariants({ size: 'md' }), 'px-[15px] text-sm');
  const chipInactive = cn(buttonVariants({ variant: 'ghost', size: 'md' }), 'border border-line px-[15px] text-sm');

  return (
    <div className="flex flex-col gap-3 border-t border-surface-2 pt-4">
      <span className="font-sans text-sm font-semibold text-ink">
        Qulaylik ehtiyojlaringiz <span className="font-normal text-ink-soft">(ixtiyoriy, keyin ham o'zgartirasiz)</span>
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleContrast}
          aria-pressed={contrast === 'high'}
          className={contrast === 'high' ? chipActive : chipInactive}
        >
          Yuqori kontrast
        </button>
        <button
          type="button"
          onClick={toggleFontScale}
          aria-pressed={fontScale === 'lg'}
          className={fontScale === 'lg' ? chipActive : chipInactive}
        >
          Katta shrift
        </button>
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="min-h-touch gap-1.5 px-3 text-sm"
    >
      <ArrowLeftIcon width={16} height={16} aria-hidden="true" />
      Orqaga
    </Button>
  );
}

function NextButton({ children, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button size="lg" {...props}>
      {children}
      <ChevronRightIcon width={16} height={16} aria-hidden="true" />
    </Button>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<CourseCard[]>([]);
  // 2-bosqichdan "Orqaga" bosib 1-bosqichga qaytilganda telefon/ism/parol
  // React state'da saqlanib qoladi — agar foydalanuvchi hech narsa
  // o'zgartirmasdan yana "Davom etish" bossa, qayta ro'yxatdan o'tish so'rovi
  // backend'dan "allaqachon ro'yxatdan o'tgan" xatosi bilan qaytadi va
  // foydalanuvchini 1-bosqichda qamab qo'yadi. Shu holatni oldini olish uchun
  // muvaffaqiyatli ro'yxatdan o'tilgan telefon raqami saqlanadi.
  const [registeredPhone, setRegisteredPhone] = useState<string | null>(null);

  function toggleInterest(key: string) {
    setInterests((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, key];
    });
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    // Shu telefon bilan bu seans ichida allaqachon muvaffaqiyatli ro'yxatdan
    // o'tilgan (masalan "Orqaga" bosib qaytilgan) — qayta so'rov yubormay
    // to'g'ridan-to'g'ri keyingi bosqichga o'tamiz.
    if (registeredPhone && registeredPhone === phone) {
      setStep(2);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, full_name: fullName, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(extractError(data));
        return;
      }
      setDevCode(data.dev_code ?? null);
      if (data.dev_code) setCode(data.dev_code); // dev rejimida qo'lda kiritish shart emas
      setRegisteredPhone(phone);
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecommendations() {
    const steps = interests
      .map((key) => COURSE_CATEGORIES.find((c) => c.key === key)?.step)
      .filter((s): s is 0 | 1 | 2 | 3 | 4 => s !== undefined);
    const targetStep = steps[0] ?? 1;
    try {
      const res = await fetch(`/api/courses?step=${targetStep}&limit=2`);
      const data = await res.json();
      let items: CourseCard[] = res.ok ? (data.items ?? []) : [];
      if (items.length === 0) {
        const fallback = await fetch('/api/courses?limit=2');
        const fallbackData = await fallback.json();
        items = fallback.ok ? (fallbackData.items ?? []) : [];
      }
      setRecommended(items.slice(0, 2));
    } catch {
      setRecommended([]);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(extractError(data));
        return;
      }
      await fetchRecommendations();
      setStep(4);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/brand/imkon-mark-color.svg" alt="" aria-hidden="true" width={28} height={28} className="h-7 w-7 shrink-0" />
          <span className="font-display text-md font-bold text-ink">Ro'yxatdan o'tish</span>
        </Link>
        <span className="font-sans text-xs font-semibold text-ink-soft">{step}-bosqich / 4</span>
      </div>

      <ProgressLadder step={step} />

      {error && (
        <p role="alert" className="rounded-2xl border border-error bg-error-bg p-3 font-sans text-sm text-error">
          {error}
        </p>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-5"
        >
          {step === 1 && (
            <form onSubmit={handleRegister} className="flex flex-col gap-5 rounded-xl border border-line bg-paper p-7">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-bold tracking-tight text-ink">Hisobingizni yarating</h2>
                <p className="font-sans text-sm text-ink-soft">
                  Ism, telefon raqami va parolingizni kiriting — bir daqiqa vaqt oladi.
                </p>
              </div>
              <Input
                label="To'liq ism"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
              <Input
                label="Telefon raqami"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                hint="+998 XX XXX XX XX"
                autoComplete="tel"
              />
              <Input
                label="Parol"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                hint="Kamida 8 belgi"
                autoComplete="new-password"
              />
              <NextButton type="submit" disabled={loading} className="w-full">
                {loading ? 'Yuborilmoqda…' : 'Davom etish'}
              </NextButton>
            </form>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col gap-5 rounded-xl border border-line bg-paper p-7">
                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink">Nima o'rganmoqchisiz?</h2>
                  <p className="font-sans text-sm text-ink-soft">
                    Kamida bittasini tanlang — kurs va vakansiya tavsiyalari shunga qarab tuziladi.
                  </p>
                </div>
                <CategoryGrid interests={interests} onToggle={toggleInterest} />
                <p className="font-sans text-xs text-ink-soft">
                  {interests.length}/{MAX_INTERESTS} tanlandi
                </p>
                <AccessPrefsRow />
              </div>
              <div className="flex items-center justify-between">
                <BackButton onClick={() => setStep(1)} />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex min-h-touch items-center rounded-md px-2 font-sans text-sm font-semibold text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                  >
                    Keyinroq
                  </button>
                  <NextButton type="button" onClick={() => setStep(3)}>
                    Davom etish
                  </NextButton>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <form
              onSubmit={handleVerify}
              className="flex flex-col gap-5 rounded-xl border border-line bg-paper p-7"
            >
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-bold tracking-tight text-ink">Telefonni tasdiqlang</h2>
                <p className="font-sans text-sm text-ink-soft">{phone} raqamiga yuborilgan 6 xonali kodni kiriting.</p>
              </div>
              {devCode && (
                <p className="rounded-2xl border border-dashed border-line p-3 font-mono text-xs text-ink-soft">
                  Dev rejimi kodi: <strong className="text-ink">{devCode}</strong>
                </p>
              )}
              <Input
                label="Tasdiqlash kodi"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                hint="6 xonali kod"
                autoComplete="one-time-code"
              />
              <div className="flex items-center justify-between">
                <BackButton onClick={() => setStep(2)} />
                <NextButton type="submit" disabled={loading}>
                  {loading ? 'Tekshirilmoqda…' : 'Tasdiqlash'}
                </NextButton>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5 rounded-xl border border-line bg-paper p-7">
              <span
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success animate-check-pop motion-reduce:animate-none"
              >
                <CheckIcon width={24} height={24} />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-bold tracking-tight text-ink">Hisobingiz tayyor!</h2>
                <p className="font-sans text-sm text-ink-soft">
                  Raqamli narvon bo'ylab birinchi qadamni qo'ydingiz.
                </p>
              </div>

              {recommended.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-sans text-sm font-semibold text-ink">Ziyo sizga shu kurslarni tavsiya qiladi:</p>
                  <ul className="flex flex-col gap-2">
                    {recommended.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/kurslar/${c.slug}`}
                          className="flex min-h-touch items-center justify-between rounded-lg border border-line px-4 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                        >
                          <span className="font-sans text-sm text-ink">{c.title}</span>
                          <span className="font-sans text-xs font-semibold text-primary">
                            {c.is_free ? 'Bepul' : `${formatThousands(c.price)} so'm`}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <NextButton type="button" onClick={() => router.push('/mening-yolim')} className="w-full">
                Mening yo'limni ko'rish
              </NextButton>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
