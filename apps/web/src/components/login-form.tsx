'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@imkon/ui';

// Faqat mahalliy dev muhitida ishlatiladigan demo hisob (barcha rollar bilan) —
// production'da hech qachon ko'rsatilmaydi (LoginPage `isDev` server-side hisoblaydi).
const DEMO_PHONE = '+998900000001';
const DEMO_PASSWORD = 'demo12345';

function redirectForRoles(roles: string[]): string {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('instructor')) return '/ustoz/kurslar';
  return '/mening-yolim';
}

// Demo hisob barcha rollarga ega — har bir tugma o'sha rol kabinetiga
// to'g'ridan-to'g'ri kirish uchun. Moderator admin bilan bir xil sahifaga
// tushadi (demo hisobda ikkalasi ham bor), mentor uchun alohida kabinet
// yo'q (/ustoz endi faqat mentorlik so'rash sahifasi) — shu sabab ikkalasi
// ro'yxatga qo'shilmadi.
const DEMO_ROLE_LINKS: { label: string; href: string }[] = [
  { label: 'Foydalanuvchi', href: '/mening-yolim' },
  { label: 'Ustoz', href: '/ustoz/kurslar' },
  { label: 'Ish beruvchi', href: '/ish-beruvchi' },
  { label: 'Donor', href: '/donor' },
  { label: 'Davlat', href: '/davlat' },
  { label: 'Admin', href: '/admin' },
];

export function LoginForm({ isDev = false }: { isDev?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const explicitNext = params.get('next');

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(loginPhone: string, loginPassword: string, forceNext?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.detail === 'string' ? data.detail : 'Kirishda xatolik yuz berdi.');
        return;
      }
      // Rol tugmasi bosilganda (forceNext) o'sha kabinetga aniq boriladi —
      // sahifadagi eski `?next=` parametridan qat'i nazar.
      let next = forceNext ?? explicitNext;
      if (!next) {
        const meRes = await fetch('/api/me');
        const me = meRes.ok ? await meRes.json() : null;
        next = redirectForRoles(me?.roles ?? []);
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void login(phone, password);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <p role="alert" className="rounded-2xl border border-error bg-error-bg p-3 font-sans text-sm text-error">
          {error}
        </p>
      )}
      <Input
        label="Telefon raqami"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
        autoComplete="tel"
        placeholder="+998 90 123 45 67"
      />
      <Input
        label="Parol"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      <Button type="submit" size="lg" isLoading={loading} className="w-full">
        {loading ? 'Kirilmoqda…' : 'Kirish'}
      </Button>

      <p className="font-sans text-xs leading-relaxed text-ink-soft">
        Kirish orqali <span className="font-semibold text-primary">Foydalanish shartlari</span> va{' '}
        <span className="font-semibold text-primary">Maxfiylik siyosati</span>ga rozilik bildirasiz.
      </p>

      {isDev && (
        <div className="rounded-2xl border border-dashed border-line p-3">
          <p className="font-mono text-xs text-ink-soft">
            DEV: {DEMO_PHONE} / {DEMO_PASSWORD} (barcha rollar)
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            disabled={loading}
            onClick={() => void login(DEMO_PHONE, DEMO_PASSWORD)}
          >
            Demo hisob bilan kirish
          </Button>

          <p className="mt-3 font-mono text-xs uppercase tracking-wide text-ink-soft">
            Rol kabinetiga to&apos;g&apos;ridan-to&apos;g&apos;ri kirish
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Rol bo'yicha demo kirish">
            {DEMO_ROLE_LINKS.map((r) => (
              <Button
                key={r.href}
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => void login(DEMO_PHONE, DEMO_PASSWORD, r.href)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
