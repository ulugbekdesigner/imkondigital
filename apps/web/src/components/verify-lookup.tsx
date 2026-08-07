'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@imkon/ui';

export function VerifyLookup() {
  const router = useRouter();
  const [uid, setUid] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = uid.trim();
    if (trimmed) router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
      // Bu forma /verify (Robot Aurora) sahifasidagi doim-oq imk-card ichida
      // joylashadi — @imkon/ui Input/Button esa umumiy ilova --ink/--paper
      // tokenlaridan foydalanadi (Tungi rejimda qorong'ilashadi). Karta doim
      // yorug' bo'lgani uchun bu tokenlarni shu subtree'da yorug' rejim
      // qiymatlariga qadab qo'yamiz — aks holda matn/chegara Tungi rejimda
      // oq karta ustida ko'rinmay qoladi. Xom hex emas, globals.css
      // :root'dagi muzlatilgan --static-oq-* tokenlaridan olinadi
      // (CONTRIBUTING.md 4-qoidasi: dizayn faqat var(--...) orqali).
      style={{
        '--ink': '16 26 51',
        '--ink-soft': 'var(--static-oq-ink-soft)',
        '--paper': 'var(--static-oq-paper)',
        '--line': 'var(--static-oq-line)',
        '--surface-2': 'var(--static-oq-surface-2)',
        '--imkon-bright': '63 114 207',
      } as React.CSSProperties}
    >
      <div className="flex-1">
        <Input
          label="Sertifikat ID"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          hint="Sertifikatdagi ID yoki QR havolasidan"
          required
        />
      </div>
      <Button type="submit">Tekshirish</Button>
    </form>
  );
}
