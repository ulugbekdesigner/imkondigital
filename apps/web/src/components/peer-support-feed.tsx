'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@imkon/ui';
import { AlertIcon } from '@/components/shell-icons';
import { formatRelativeTime } from '@/lib/format';
import type { PeerSupportPostOut } from '@/lib/types';

const POLL_INTERVAL_MS = 8000;

function ReportButton({ postId }: { postId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/peer-support/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setSent(true);
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <span className="font-sans text-xs text-ink-soft">Shikoyat yuborildi</span>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {open ? (
        <div className="flex items-center gap-1.5">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Sabab (ixtiyoriy)"
            className="h-8 rounded-full border border-line bg-paper px-3 font-sans text-xs text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          <Button size="sm" variant="ghost" disabled={busy} onClick={submit}>
            Yuborish
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start font-sans text-xs text-ink-soft hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Shikoyat qilish
        </button>
      )}
    </div>
  );
}

function ModeratorHideControl({
  post,
  onChanged,
}: {
  post: PeerSupportPostOut;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function hide() {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/peer-support/posts/${post.id}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setOpen(false);
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  }

  async function unhide() {
    setBusy(true);
    try {
      const res = await fetch(`/api/peer-support/posts/${post.id}/unhide`, { method: 'POST' });
      if (res.ok) onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (post.is_hidden) {
    return (
      <Button size="sm" variant="outline" disabled={busy} onClick={unhide}>
        Qaytarish
      </Button>
    );
  }

  return open ? (
    <div className="flex items-center gap-1.5">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Yashirish sababi"
        className="h-8 rounded-full border border-line bg-paper px-3 font-sans text-xs text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      />
      <Button size="sm" variant="danger" disabled={busy || !reason.trim()} onClick={hide}>
        Yashirish
      </Button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="self-start font-sans text-xs font-semibold text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      Moderator: yashirish
    </button>
  );
}

export function PeerSupportFeed({
  roomId,
  initialPosts,
  isModerator,
}: {
  roomId: number;
  initialPosts: PeerSupportPostOut[];
  isModerator: boolean;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  async function refresh() {
    const res = await fetch(`/api/peer-support/rooms/${roomId}/posts`).catch(() => null);
    if (res?.ok) setPosts((await res.json()) as PeerSupportPostOut[]);
  }

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [posts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/peer-support/rooms/${roomId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const post = (await res.json()) as PeerSupportPostOut;
        setPosts((prev) => [...prev, post]);
        setBody('');
      } else {
        setError('Xabar yuborishda xatolik yuz berdi.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn-bg p-3">
        <AlertIcon width={16} height={16} className="mt-0.5 shrink-0 text-warn" />
        <p className="font-sans text-xs text-ink">
          Bu — real odamlar orasidagi suhbat, AI emas. Tibbiy yoki psixologik yordam kerak bo'lsa,{' '}
          <Link href="/ruhiy-kuch" className="font-semibold underline underline-offset-2">
            shu yerdan
          </Link>{' '}
          professional yordamga murojaat qiling.
        </p>
      </div>

      <ul ref={listRef} className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto rounded-xl border border-line bg-paper p-4">
        {posts.length === 0 && (
          <li className="font-sans text-base text-ink-soft">
            Hali post yo'q — birinchi bo'lib yozing.
          </li>
        )}
        {posts.map((p) => (
          <li
            key={p.id}
            className={
              p.is_hidden
                ? 'flex flex-col gap-1.5 rounded-lg border border-dashed border-error/40 bg-error-bg/40 p-3'
                : p.is_own
                  ? 'ml-auto flex max-w-[85%] flex-col gap-1.5 rounded-lg bg-primary px-3 py-2 text-primary-fg'
                  : 'mr-auto flex max-w-[85%] flex-col gap-1.5 rounded-lg bg-mint px-3 py-2 text-ink'
            }
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-sans text-xs font-semibold opacity-80">{p.author_name}</p>
              <p className="font-mono text-[10px] opacity-70">{formatRelativeTime(p.created_at)}</p>
            </div>
            {p.is_hidden ? (
              <p className="font-sans text-sm italic text-ink-soft">
                Bu post moderator tomonidan yashirilgan{p.hidden_reason ? ` — ${p.hidden_reason}` : ''}
              </p>
            ) : (
              <p className="whitespace-pre-wrap font-sans text-base">{p.body}</p>
            )}
            <div className="mt-1 flex items-center justify-between gap-2">
              {!p.is_own && !p.is_hidden && <ReportButton postId={p.id} />}
              {isModerator && <ModeratorHideControl post={p} onChanged={refresh} />}
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="peer-support-body" className="sr-only">
          Xabar yozing
        </label>
        <textarea
          id="peer-support-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="O'z tajribangiz yoki savolingizni yozing…"
          className="min-h-touch w-full rounded-xl border border-line bg-paper px-3 py-2 font-sans text-base text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        />
        <Button type="submit" isLoading={sending} disabled={sending || !body.trim()}>
          Yuborish
        </Button>
      </form>
    </div>
  );
}
