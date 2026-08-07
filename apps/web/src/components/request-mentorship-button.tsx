'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';
import { CheckIcon } from '@/components/shell-icons';

export function RequestMentorshipButton({ mentorId }: { mentorId: number }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function request() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mentorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentor_id: mentorId, message: message.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 409
            ? "Siz bu ustozga allaqachon so'rov yubordingiz."
            : (data.detail ?? "So'rov yuborishda xatolik yuz berdi."),
        );
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="flex items-center gap-1.5 font-sans text-base text-ink">
        <CheckIcon width={16} height={16} className="shrink-0 text-primary" />
        So'rov yuborildi
      </p>
    );
  }

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
        Mentorlik so'rash
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:max-w-sm">
      <label htmlFor={`mentorship-message-${mentorId}`} className="sr-only">
        Nima uchun mentorlik so'rayapsiz (ixtiyoriy)
      </label>
      <textarea
        id={`mentorship-message-${mentorId}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        placeholder="Nima uchun mentorlik kerak, qanday yordam kutasiz? (ixtiyoriy)"
        className="min-h-touch w-full rounded-lg border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={loading} onClick={request}>
          {loading ? 'Yuborilmoqda…' : "So'rovni yuborish"}
        </Button>
        <Button variant="ghost" size="sm" disabled={loading} onClick={() => setExpanded(false)}>
          Bekor qilish
        </Button>
      </div>
      {error && (
        <p role="alert" className="font-sans text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
