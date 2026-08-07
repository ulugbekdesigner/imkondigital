'use client';

import { useState } from 'react';
import { Button, buttonVariants } from '@imkon/ui';
import { formatDateTime } from '@/lib/format';
import { avatarGradient, initialsOf } from '@/lib/avatar';
import { SimpleMarkdown } from '@/components/simple-markdown';
import { AlertIcon, EditIcon } from '@/components/shell-icons';
import type { GeneratedCvOut, Me } from '@/lib/types';

export function CvBuilderPanel({
  initialCv,
  me,
  regionName,
  skills,
  vacancyOptions,
}: {
  initialCv: GeneratedCvOut | null;
  me: Me;
  regionName: string | undefined;
  skills: string[];
  vacancyOptions: { id: number; title: string }[];
}) {
  const [cv, setCv] = useState(initialCv);
  const [vacancyId, setVacancyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancy_id: vacancyId ? Number(vacancyId) : null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Kunlik CV yaratish limiti tugadi. Ertaga qayta urinib ko'ring."
            : (data.detail ?? 'CV yaratishda xatolik yuz berdi.'),
        );
        return;
      }
      setCv(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[18px] border border-line bg-paper p-[18px]">
        <div className="flex items-center gap-3">
          {me.avatar_url ? (
            // Foydalanuvchi yuklagan tashqi (MinIO) media — next/image optimallashtira olmaydi.
            <img
              src={me.avatar_url}
              alt=""
              className="h-[46px] w-[46px] shrink-0 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              aria-hidden="true"
              style={{ background: avatarGradient(me.id) }}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full font-display text-base font-bold text-white"
            >
              {initialsOf(me.full_name)}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-sans text-base font-bold text-ink">{me.full_name}</span>
            {regionName && <span className="font-sans text-xs text-ink-soft">{regionName}</span>}
          </div>
        </div>

        {cv ? (
          <>
            <div className="my-3 h-px bg-line" />
            <SimpleMarkdown text={cv.content} className="flex flex-col gap-2 font-sans text-sm text-ink" />
          </>
        ) : loading ? (
          <div className="mt-3 flex flex-col gap-2" role="status" aria-label="CV tayyorlanmoqda…">
            <span className="imk-skeleton" style={{ width: '92%' }} />
            <span className="imk-skeleton" style={{ width: '78%' }} />
            <span className="imk-skeleton" style={{ width: '85%' }} />
            <span className="imk-skeleton" style={{ width: '60%' }} />
          </div>
        ) : (
          <div className="mt-3 flex items-start gap-3">
            <span className="imk-empty__icon shrink-0">
              <EditIcon width={18} height={18} aria-hidden="true" />
            </span>
            <p className="font-sans text-sm text-ink-soft">
              Hali CV yaratilmagan. Sertifikatlaringiz va portfolio ma'lumotlaringiz asosida AI
              professional CV tuzib beradi — pastdagi tugma orqali boshlang.
            </p>
          </div>
        )}

        {skills.length > 0 && (
          <>
            <div className="my-3 h-px bg-line" />
            <span className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">
              Ko'nikmalar
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-surface-2 px-[11px] py-1.5 font-sans text-xs font-semibold text-ink"
                >
                  {skill}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {vacancyOptions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cv-vacancy" className="font-sans text-sm font-semibold text-ink">
            Qaysi vakansiyaga moslashtiray? (ixtiyoriy)
          </label>
          <select
            id="cv-vacancy"
            value={vacancyId}
            onChange={(e) => setVacancyId(e.target.value)}
            className="min-h-touch w-full rounded-full border border-line bg-paper px-4 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <option value="">Umumiy CV</option>
            {vacancyOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div role="alert" className="imk-error !flex-row !items-center !p-3">
          <AlertIcon width={18} height={18} className="shrink-0 text-error" />
          <p className="flex-1 font-sans text-sm text-error">{error}</p>
          <button
            type="button"
            onClick={generate}
            className="min-h-touch shrink-0 rounded-full px-3 font-sans text-sm font-semibold text-primary hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Qayta urinish
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          isLoading={loading}
          disabled={loading}
          onClick={generate}
          variant={cv ? 'outline' : 'primary'}
          className="flex-1"
        >
          {loading ? 'Tayyorlanmoqda…' : cv ? 'Qayta yaratish' : "CV'ni yaratish"}
        </Button>
        {cv?.pdf_url && (
          <a
            href={cv.pdf_url}
            target="_blank"
            rel="noreferrer"
            className={`flex-1 ${buttonVariants()}`}
          >
            PDF yuklab olish
          </a>
        )}
      </div>
      {cv && (
        <p className="font-mono text-xs text-ink-soft">
          Yaratilgan sana: {formatDateTime(cv.generated_at)}
        </p>
      )}
    </div>
  );
}
