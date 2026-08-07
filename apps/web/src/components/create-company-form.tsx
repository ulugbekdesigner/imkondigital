'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@imkon/ui';
import { InfoIcon } from '@/components/shell-icons';

export function CreateCompanyForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [inn, setInn] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          inn: inn || null,
          description,
          employee_count: employeeCount ? Number(employeeCount) : null,
        }),
      });
      if (!res.ok) {
        setError('Kompaniya yaratishda xatolik yuz berdi.');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-line bg-paper p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Kompaniyangizni ro'yxatdan o'tkazing</h2>
      <Input label="Kompaniya nomi" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="STIR (ixtiyoriy)" value={inn} onChange={(e) => setInn(e.target.value)} />
      <Input
        label="Xodimlar soni (ixtiyoriy)"
        type="number"
        min={0}
        value={employeeCount}
        onChange={(e) => setEmployeeCount(e.target.value)}
        hint="Inklyuziv kvota tavsiyasini hisoblash uchun"
      />
      <Input
        label="Tavsif"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        hint="Ixtiyoriy"
      />
      <div className="flex gap-2.5 rounded-xl bg-surface-2 p-3.5">
        <InfoIcon width={16} height={16} className="mt-0.5 shrink-0 text-ink-soft" />
        <p className="font-sans text-sm leading-relaxed text-ink-soft">
          Kompaniyangiz darhol yaratiladi va bir zumda vakansiya joylashtira olasiz. Moderatsiya
          tekshiruvidan so&apos;ng profilingizga &quot;Tasdiqlangan ish beruvchi&quot; belgisi qo&apos;shiladi.
        </p>
      </div>
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? 'Yaratilmoqda…' : 'Kompaniya yaratish'}
      </Button>
    </form>
  );
}
