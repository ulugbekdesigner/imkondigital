'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@imkon/ui';
import type { EmploymentType, Region, WorkFormat } from '@/lib/types';
import { ACCOMMODATION_OPTIONS } from '@/lib/vacancy-accommodations';

const STEPS = [
  { value: 0, label: '0 · Savodxonlik' },
  { value: 1, label: '1 · Yordamchi' },
  { value: 2, label: '2 · Mutaxassislik' },
  { value: 3, label: '3 · IT' },
  { value: 4, label: '4 · Tadbirkorlik' },
];

const WORK_FORMATS: { value: WorkFormat; label: string }[] = [
  { value: 'remote', label: 'Masofaviy' },
  { value: 'hybrid', label: 'Gibrid' },
  { value: 'office', label: 'Ofisda' },
];

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: "To'liq stavka" },
  { value: 'part_time', label: 'Qisman stavka' },
  { value: 'project', label: 'Loyihaviy' },
];

export function CreateVacancyForm({
  companyId,
  regions,
}: {
  companyId: number;
  regions: Region[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ladderStep, setLadderStep] = useState(1);
  const [workFormat, setWorkFormat] = useState<WorkFormat>('remote');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time');
  const [salaryFrom, setSalaryFrom] = useState('');
  const [salaryTo, setSalaryTo] = useState('');
  const [regionId, setRegionId] = useState('');
  const [accommodations, setAccommodations] = useState<Set<string>>(new Set());
  const [salaryError, setSalaryError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleAccommodation(key: string) {
    setAccommodations((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submit(publish: boolean) {
    if (publish && (!salaryFrom || !salaryTo)) {
      setSalaryError(true);
      return;
    }
    setSalaryError(false);
    setLoading(true);
    setError(null);
    try {
      const createRes = await fetch(`/api/companies/${companyId}/vacancies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          ladder_step: ladderStep,
          work_format: workFormat,
          employment_type: employmentType,
          salary_from: salaryFrom ? Number(salaryFrom) : null,
          salary_to: salaryTo ? Number(salaryTo) : null,
          region_id: regionId ? Number(regionId) : null,
          accommodations: Object.fromEntries([...accommodations].map((k) => [k, true])),
        }),
      });
      if (!createRes.ok) {
        setError('Vakansiya yaratishda xatolik yuz berdi.');
        return;
      }
      const created = await createRes.json();
      if (publish) {
        const pubRes = await fetch(`/api/vacancies/${created.id}/publish`, { method: 'POST' });
        if (!pubRes.ok) {
          setError('Vakansiya yaratildi, lekin chop etishda xatolik bo‘ldi.');
          return;
        }
      }
      router.push(`/ish-beruvchi/vakansiyalar/${created.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(true);
      }}
      className="flex flex-col gap-5 rounded-lg border border-line bg-paper p-5"
    >
      <Input
        label="Lavozim nomi"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        hint="Masalan: “Proektim bor, ishchi kerak” yoki aniq lavozim nomi"
      />
      <Input
        label="Tavsif (ixtiyoriy)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        hint="Vazifalar, talablar, moslashuv imkoniyatlari"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="mb-2 font-sans text-base font-medium text-ink">Ish formati</legend>
          <div className="flex flex-wrap gap-2">
            {WORK_FORMATS.map((f) => (
              <label
                key={f.value}
                className="flex min-h-touch cursor-pointer items-center rounded border border-line px-3 has-[:checked]:border-primary has-[:checked]:bg-mint"
              >
                <input
                  type="radio"
                  name="work_format"
                  className="sr-only"
                  checked={workFormat === f.value}
                  onChange={() => setWorkFormat(f.value)}
                />
                <span className="font-sans text-base text-ink">{f.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-sans text-base font-medium text-ink">Narvon pog'onasi</legend>
          <div className="flex flex-wrap gap-2">
            {STEPS.map((s) => (
              <label
                key={s.value}
                className="flex min-h-touch cursor-pointer items-center rounded border border-line px-3 has-[:checked]:border-primary has-[:checked]:bg-mint"
              >
                <input
                  type="radio"
                  name="step"
                  className="sr-only"
                  checked={ladderStep === s.value}
                  onChange={() => setLadderStep(s.value)}
                />
                <span className="font-sans text-base text-ink">{s.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Maosh (dan), so'm"
          type="number"
          min={0}
          value={salaryFrom}
          onChange={(e) => setSalaryFrom(e.target.value)}
          error={salaryError && !salaryFrom ? "Maosh oralig'ini ko'rsatish majburiy" : undefined}
          hint={salaryError && !salaryFrom ? undefined : 'Nashr qilish uchun majburiy'}
        />
        <Input
          label="Maosh (gacha), so'm"
          type="number"
          min={0}
          value={salaryTo}
          onChange={(e) => setSalaryTo(e.target.value)}
          error={salaryError && !salaryTo ? "Maosh oralig'ini ko'rsatish majburiy" : undefined}
          hint={salaryError && !salaryTo ? undefined : 'Nashr qilish uchun majburiy'}
        />
      </div>

      <fieldset className="border-t border-line pt-4">
        <legend className="mb-2 font-sans text-base font-semibold text-ink">
          Moslashtirilgan sharoitlar
        </legend>
        <div className="flex flex-wrap gap-2">
          {ACCOMMODATION_OPTIONS.map((a) => (
            <label
              key={a.key}
              className="flex min-h-touch cursor-pointer items-center rounded-full border border-line px-3.5 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-fg"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={accommodations.has(a.key)}
                onChange={() => toggleAccommodation(a.key)}
              />
              <span className="font-sans text-sm font-medium">{a.label}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 font-sans text-xs text-ink-soft">
          Kamida bitta sharoit tanlansa, vakansiya "Inklyuziv" belgisini oladi va nomzodlar uchun
          moslik foizi yuqoriroq hisoblanadi.
        </p>
      </fieldset>

      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={loading || !title.trim()}
          onClick={() => submit(false)}
          className="flex-1"
        >
          Qoralama saqlash
        </Button>
        <Button type="submit" disabled={loading || !title.trim()} className="flex-1">
          {loading ? 'Yuborilmoqda…' : 'Nashr qilish'}
        </Button>
      </div>

      <details className="rounded-lg border border-line p-3">
        <summary className="cursor-pointer font-sans text-sm font-medium text-ink">
          Qo'shimcha sozlamalar (ixtiyoriy)
        </summary>
        <div className="mt-4 flex flex-col gap-5">
          <fieldset>
            <legend className="mb-2 font-sans text-base font-medium text-ink">Bandlik turi</legend>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map((t) => (
                <label
                  key={t.value}
                  className="flex min-h-touch cursor-pointer items-center rounded border border-line px-3 has-[:checked]:border-primary has-[:checked]:bg-mint"
                >
                  <input
                    type="radio"
                    name="employment_type"
                    className="sr-only"
                    checked={employmentType === t.value}
                    onChange={() => setEmploymentType(t.value)}
                  />
                  <span className="font-sans text-base text-ink">{t.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="vacancy-region-select" className="font-sans text-base font-medium text-ink">
              Hudud (ixtiyoriy)
            </label>
            <select
              id="vacancy-region-select"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="min-h-touch w-full rounded border border-line bg-paper px-3 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <option value="">Butun O'zbekiston / masofaviy</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>
    </form>
  );
}
