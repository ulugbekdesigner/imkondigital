'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';
import { AttachIcon } from '@/components/shell-icons';

const GROUPS = [
  { value: '1', label: '1-guruh' },
  { value: '2', label: '2-guruh' },
  { value: '3', label: '3-guruh' },
  { value: 'child', label: 'Nogironligi bor bola' },
];

const CATEGORIES = [
  { value: "ko'rish", label: "Ko'rish" },
  { value: 'eshitish', label: 'Eshitish' },
  { value: 'harakat', label: 'Harakat-tayanch' },
  { value: 'nutq', label: 'Nutq' },
];

export function DisabilityForm({
  verifiedStatus,
  docUrl,
}: {
  verifiedStatus: string | null;
  docUrl: string | null;
}) {
  const router = useRouter();
  const [group, setGroup] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [currentDocUrl, setCurrentDocUrl] = useState(docUrl);

  async function handleDocUpload(file: File) {
    setDocUploading(true);
    setDocError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/me/disability/document', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setDocError(typeof data.detail === 'string' ? data.detail : 'Yuklashda xatolik yuz berdi.');
        return;
      }
      setCurrentDocUrl(data.doc_url);
      router.refresh();
    } finally {
      setDocUploading(false);
    }
  }

  function toggleCategory(value: string) {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/me/disability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_type: group || null,
          categories,
          work_conditions: { remote_only: remoteOnly },
        }),
      });
      if (res.ok) {
        setMessage("Ma'lumot yuborildi. Moderator tasdig'ini kuting.");
        router.refresh();
      } else {
        setMessage('Yuborishda xatolik. Qaytadan urinib ko\'ring.');
      }
    } finally {
      setLoading(false);
    }
  }

  const fieldset =
    'flex flex-wrap gap-2.5 border border-line rounded-lg p-4 focus-within:ring-2 focus-within:ring-focus';
  const chip =
    'min-h-touch inline-flex items-center gap-2 rounded border border-line px-3 font-sans text-base text-ink cursor-pointer hover:bg-mint has-[:checked]:bg-primary has-[:checked]:text-primary-fg';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <p className="font-sans text-base text-ink-soft">
        Bu ma'lumot ixtiyoriy va maxfiy. U faqat sizga mos imkoniyatlarni topish uchun
        ishlatiladi va ish beruvchiga faqat sizning roziligingiz bilan ochiladi.
      </p>

      <fieldset>
        <legend className="mb-2.5 font-sans text-base font-medium text-ink">Nogironlik guruhi</legend>
        <div className={fieldset}>
          {GROUPS.map((g) => (
            <label key={g.value} className={chip}>
              <input
                type="radio"
                name="group"
                value={g.value}
                checked={group === g.value}
                onChange={(e) => setGroup(e.target.value)}
              />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 font-sans text-base font-medium text-ink">Toifalar</legend>
        <div className={fieldset}>
          {CATEGORIES.map((c) => (
            <label key={c.value} className={chip}>
              <input
                type="checkbox"
                value={c.value}
                checked={categories.includes(c.value)}
                onChange={() => toggleCategory(c.value)}
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className={`${chip} self-start`}>
        <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
        Faqat masofaviy ish
      </label>

      <div className="flex flex-col gap-2">
        <span className="font-sans text-base font-medium text-ink">Tasdiqlovchi hujjat</span>
        <p className="font-sans text-sm text-ink-soft">
          MSEK ma&apos;lumotnomasi yoki shunga o&apos;xshash hujjat (PDF, JPG yoki PNG, 8 MB gacha) —
          moderator shu hujjatga qarab tasdiqlaydi.
        </p>
        {currentDocUrl && (
          <a
            href={currentDocUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1.5 font-sans text-sm text-primary underline-offset-4 hover:underline"
          >
            <AttachIcon width={16} height={16} aria-hidden="true" />
            Yuklangan hujjatni ko&apos;rish
          </a>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleDocUpload(file);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={docUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {docUploading ? 'Yuklanmoqda…' : currentDocUrl ? 'Boshqa hujjat yuklash' : 'Hujjat yuklash'}
        </Button>
        {docError && (
          <p role="alert" className="font-sans text-sm text-error">
            {docError}
          </p>
        )}
      </div>

      {message && (
        <p role="status" className="rounded border border-line bg-mint p-3 font-sans text-base text-ink">
          {message}
        </p>
      )}

      <Button type="submit" disabled={loading} className="self-start">
        {loading ? 'Yuborilmoqda…' : verifiedStatus ? 'Ma\'lumotni yangilash' : 'Ma\'lumotni yuborish'}
      </Button>
    </form>
  );
}
