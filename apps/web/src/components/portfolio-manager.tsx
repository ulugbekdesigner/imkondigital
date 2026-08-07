'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ConfirmDialog, Input } from '@imkon/ui';
import { ClipboardIcon } from '@/components/shell-icons';
import { EmptyState } from '@/components/state-panels';
import { PortfolioCard } from './portfolio-card';
import { PortfolioItemEditor } from './portfolio-item-editor';
import type { PortfolioItem } from '@/lib/types';

export function PortfolioManager({ initialItems }: { initialItems: PortfolioItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('title', title);
      form.set('description', description);
      if (file) form.append('files', file);

      const res = await fetch('/api/portfolio', { method: 'POST', body: form });
      if (!res.ok) {
        setError("Qo'shishda xatolik yuz berdi.");
        return;
      }
      const item = (await res.json()) as PortfolioItem;
      setItems((prev) => [item, ...prev]);
      setTitle('');
      setDescription('');
      setFile(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (pendingDeleteId === null) return;
    setDeleting(true);
    try {
      await fetch(`/api/portfolio/${pendingDeleteId}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== pendingDeleteId));
      setPendingDeleteId(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  function handleUpdate(updated: PortfolioItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-line bg-mint/40 p-4">
        <Input label="Sarlavha" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input
          label="Tavsif"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          hint="Ixtiyoriy"
        />
        <div>
          <label className="mb-1.5 block font-sans text-base font-medium text-ink" htmlFor="portfolio-file">
            Fayl (ixtiyoriy)
          </label>
          <input
            id="portfolio-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full font-sans text-base text-ink file:mr-3 file:min-h-touch file:rounded file:border-0 file:bg-primary file:px-4 file:font-sans file:text-base file:text-primary-fg"
          />
        </div>
        {error && (
          <p role="alert" className="font-sans text-base text-error">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="self-start">
          {loading ? "Qo'shilmoqda…" : "Portfolio'ga qo'shish"}
        </Button>
      </form>

      {items.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} id={`portfolio-${item.id}`} className="scroll-mt-8">
              <ul>
                <PortfolioCard item={item} onDelete={setPendingDeleteId} />
              </ul>
              <details className="mt-2 rounded-lg border border-line">
                <summary className="cursor-pointer px-3 py-2 font-sans text-sm font-medium text-ink">
                  Case-hikoyani tahrirlash
                </summary>
                <div className="p-3 pt-0">
                  <PortfolioItemEditor item={item} onUpdate={handleUpdate} />
                </div>
              </details>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={<ClipboardIcon width={24} height={24} />}
            title="Hali portfolio elementi yo'q"
            description="Yuqoridagi forma orqali birinchi ishingizni qo'shing — sarlavha va tavsif yetarli."
          />
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Portfolio ishini o'chirasizmi?"
        description="Bu amalni qaytarib bo'lmaydi."
        confirmLabel="O'chirish"
        confirmLoading={deleting}
        destructive
      />
    </div>
  );
}
