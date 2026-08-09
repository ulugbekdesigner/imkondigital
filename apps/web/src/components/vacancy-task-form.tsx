'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@imkon/ui';
import { ClipboardIcon } from '@/components/shell-icons';
import type { VacancyTaskOut } from '@/lib/types';

export function VacancyTaskForm({
  vacancyId,
  initialTask,
}: {
  vacancyId: number;
  initialTask: VacancyTaskOut | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(initialTask === null);
  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [description, setDescription] = useState(initialTask?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/vacancies/${vacancyId}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) {
        setError('Saqlashda xatolik yuz berdi.');
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardIcon width={16} height={16} className="text-ink-soft" aria-hidden="true" />
            <span className="font-sans text-sm font-bold text-ink">Sinov topshirig'i</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Tahrirlash
          </Button>
        </div>
        <p className="font-sans text-sm font-semibold text-ink">{initialTask?.title}</p>
        {initialTask?.description && (
          <p className="whitespace-pre-wrap font-sans text-sm text-ink-soft">
            {initialTask.description}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4"
    >
      <div className="flex items-center gap-2">
        <ClipboardIcon width={16} height={16} className="text-ink-soft" aria-hidden="true" />
        <span className="font-sans text-sm font-bold text-ink">Sinov topshirig'i (ixtiyoriy)</span>
      </div>
      <p className="font-sans text-xs text-ink-soft">
        Nomzodlar ariza topshirgach amaliy vazifa bajaradi — javoblarni ism/rasmsiz, faqat ish
        sifatiga qarab baholaysiz ("ko'r baholash").
      </p>
      <Input
        label="Sarlavha"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={3}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="vacancy-task-description" className="font-sans text-base font-medium text-ink">
          Ko'rsatma
        </label>
        <textarea
          id="vacancy-task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Masalan: 20 daqiqalik amaliy vazifa — nomunaviy Excel jadval tuzing va yuklang."
          className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-base text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        />
      </div>
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving || title.trim().length < 3}>
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </Button>
        {initialTask && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Bekor qilish
          </Button>
        )}
      </div>
    </form>
  );
}
