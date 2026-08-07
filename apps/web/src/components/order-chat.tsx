'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@imkon/ui';
import { AttachIcon, DownloadIcon } from '@/components/shell-icons';
import type { MessageOut } from '@/lib/types';

const POLL_INTERVAL_MS = 5000;
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

function fileNameFromUrl(url: string): string {
  return decodeURIComponent(url.split('/').pop() ?? url);
}

function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function MessageAttachment({ fileUrl }: { fileUrl: string }) {
  const name = fileNameFromUrl(fileUrl);
  if (isImageUrl(fileUrl)) {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="block w-full max-w-[220px] overflow-hidden rounded-2xl border border-line bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {/* Foydalanuvchi yuklagan tashqi (MinIO) media — next/image optimallashtira olmaydi. */}
        <img src={fileUrl} alt={name} className="h-[110px] w-full object-cover" loading="lazy" />
        <span className="flex items-center justify-between gap-2 px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-sans text-xs font-semibold text-ink">
            {name}
          </span>
          <DownloadIcon width={14} height={14} className="shrink-0 text-primary" aria-hidden="true" />
        </span>
      </a>
    );
  }
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 font-sans text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <DownloadIcon width={14} height={14} aria-hidden="true" />
      {name}
    </a>
  );
}

export function OrderChat({
  orderId,
  initialMessages,
  currentUserId,
}: {
  orderId: number;
  initialMessages: MessageOut[];
  currentUserId: number;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}/messages`).catch(() => null);
      if (res?.ok) {
        setMessages((await res.json()) as MessageOut[]);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && !file) return;
    setSending(true);
    setError(null);
    try {
      let res: Response;
      if (file) {
        const form = new FormData();
        form.set('body', body);
        form.set('file', file);
        res = await fetch(`/api/orders/${orderId}/messages/upload`, { method: 'POST', body: form });
      } else {
        res = await fetch(`/api/orders/${orderId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body }),
        });
      }
      if (res.ok) {
        const msg = (await res.json()) as MessageOut;
        setMessages((prev) => [...prev, msg]);
        setBody('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError('Xabar yuborishda xatolik yuz berdi.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-4">
      <h2 className="font-display text-lg font-semibold text-ink">Xabarlar</h2>
      <ul ref={listRef} className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && (
          <li className="font-sans text-base text-ink-soft">Hali xabar yo'q.</li>
        )}
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.sender_id === currentUserId
                ? 'ml-auto flex max-w-[80%] flex-col gap-1.5 rounded-lg bg-primary px-3 py-2 text-primary-fg'
                : 'mr-auto flex max-w-[80%] flex-col gap-1.5 rounded-lg bg-mint px-3 py-2 text-ink'
            }
          >
            <p className="font-sans text-xs font-semibold opacity-80">{m.sender_name}</p>
            {m.body && <p className="font-sans text-base">{m.body}</p>}
            {m.file_url && <MessageAttachment fileUrl={m.file_url} />}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {file && (
          <div className="flex items-center justify-between gap-2 rounded border border-line bg-mint/40 px-3 py-1.5">
            <span className="min-w-0 flex-1 truncate font-sans text-xs text-ink">{file.name}</span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="shrink-0 rounded font-sans text-xs font-semibold text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Olib tashlash
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <label htmlFor="chat-body" className="sr-only">
            Xabar yozing
          </label>
          <textarea
            id="chat-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={1}
            placeholder="Xabar yozing…"
            className="min-h-touch w-full rounded border border-line bg-paper px-3 py-2 font-sans text-base text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          />
          <label className="flex min-h-touch min-w-touch cursor-pointer items-center justify-center rounded border border-line bg-paper text-ink-soft hover:text-ink focus-within:outline-none focus-within:ring-2 focus-within:ring-focus">
            <span className="sr-only">Fayl biriktirish</span>
            <AttachIcon width={18} height={18} aria-hidden="true" />
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button type="submit" isLoading={sending} disabled={sending || (!body.trim() && !file)}>
            Yuborish
          </Button>
        </div>
      </form>
    </div>
  );
}
