'use client';

import { useEffect, useState } from 'react';
import { Button } from '@imkon/ui';
import { CheckIcon, LinkIcon, ShareIcon } from '@/components/shell-icons';

export function ProfileShareActions({ username, fullName }: { username: string; fullName: string }) {
  // Server va mijozning BIRINCHI render'i bir xil ("" origin) bo'lishi uchun —
  // window.location faqat mount'dan keyin o'qiladi (passport-settings.tsx
  // bilan bir xil andoza, hydration mismatch bo'lmasin).
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicUrl = `${origin}/u/${username}`;

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${fullName} — IMKON Digital passport`, url: publicUrl });
      } catch {
        // Foydalanuvchi ulashish oynasini bekor qildi — xatolik emas.
      }
      return;
    }
    await copyLink();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" onClick={share} className="inline-flex items-center gap-1.5">
        <ShareIcon width={16} height={16} />
        Passportni ulashish
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5"
      >
        {copied ? <CheckIcon width={16} height={16} /> : <LinkIcon width={16} height={16} />}
        {copied ? 'Nusxalandi' : 'Havolani nusxalash'}
      </Button>
    </div>
  );
}
