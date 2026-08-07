'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Radio } from '@imkon/ui';
import { CheckIcon } from '@/components/shell-icons';
import type { Me } from '@/lib/types';

const VISIBILITY_OPTIONS: { value: Me['passport_visibility']; label: string; hint: string }[] = [
  { value: 'public', label: 'Ochiq', hint: "Qidiruvga ham chiqadi" },
  { value: 'unlisted', label: 'Faqat havola bilan', hint: 'Qidiruvda chiqmaydi, havola bilan ochiladi' },
  { value: 'private', label: 'Yopiq', hint: 'Faqat siz ko\'rasiz' },
];

export function PassportSettings({ me }: { me: Me }) {
  const router = useRouter();
  const [username, setUsername] = useState(me.username);
  const [visibility, setVisibility] = useState(me.passport_visibility);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Server va mijozning BIRINCHI render'i bir xil ("" origin) bo'lishi uchun —
  // window.location faqat mount'dan keyin o'qiladi (aks holda hydration mismatch).
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicUrl = `${origin}/u/${me.username}`;

  async function saveUsername(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/me/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(res.status === 409 ? "Bu username band, boshqasini tanlang." : (data.detail ?? 'Xatolik.'));
        return;
      }
      setMessage("Username yangilandi.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function changeVisibility(value: Me['passport_visibility']) {
    setVisibility(value);
    await fetch('/api/me/visibility', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passport_visibility: value }),
    });
    router.refresh();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-sans text-base font-medium text-ink">Ommaviy sahifangiz</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
          <code className="rounded border border-line bg-mint px-4 py-2.5 font-mono text-base text-ink">
            {publicUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyLink}
            className="inline-flex items-center gap-1"
          >
            {copied && <CheckIcon width={14} height={14} />}
            {copied ? 'Nusxalandi' : 'Nusxa olish'}
          </Button>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2.5 font-sans text-base font-medium text-ink">Kimlar ko'ra oladi</legend>
        <div className="flex flex-col gap-2.5">
          {VISIBILITY_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className={`flex min-h-touch items-start rounded border px-4 py-3 ${
                visibility === opt.value ? 'border-primary bg-mint' : 'border-line'
              }`}
            >
              <Radio
                name="visibility"
                checked={visibility === opt.value}
                onChange={() => changeVisibility(opt.value)}
                label={
                  <span>
                    <span className="block font-sans text-base font-medium text-ink">{opt.label}</span>
                    <span className="block font-sans text-xs text-ink-soft">{opt.hint}</span>
                  </span>
                }
              />
            </div>
          ))}
        </div>
      </fieldset>

      <form onSubmit={saveUsername} className="flex flex-col gap-3">
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          hint="Lotin harflari, raqam va _ — 3-40 belgi"
          pattern="[a-z0-9_]{3,40}"
          required
        />
        {error && (
          <p role="alert" className="font-sans text-base text-error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="font-sans text-base text-primary">
            {message}
          </p>
        )}
        <Button type="submit" disabled={loading || username === me.username} className="self-start">
          {loading ? 'Saqlanmoqda…' : 'Saqlash'}
        </Button>
      </form>
    </div>
  );
}
