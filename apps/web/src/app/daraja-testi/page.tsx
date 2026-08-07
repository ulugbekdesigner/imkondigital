import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getPlacementTestSessions } from '@/lib/ai-api';
import { StartPlacementTestButton } from '@/components/start-placement-test-button';
import { ChevronRightIcon, ClipboardIcon } from '@/components/shell-icons';
import { formatDate } from '@/lib/format';

const LANGUAGE_LABEL: Record<string, string> = { en: 'Ingliz tili', ru: 'Rus tili' };

export const metadata: Metadata = {
  title: 'Til darajasini aniqlash testi',
  description: "AI yordamida ingliz yoki rus tilidan CEFR darajangizni (A1-C1) aniqlang.",
};

export default async function PlacementTestSessionsPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/daraja-testi');

  const sessions = await getPlacementTestSessions();

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
            <ClipboardIcon width={20} height={20} />
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">AI yordamchi</p>
            <h1 className="font-display text-2xl font-bold text-ink">Til darajasini aniqlash</h1>
          </div>
        </div>
        <p className="mt-4 font-sans text-base text-ink-soft">
          Ziyo bilan qisqa suhbat orqali ingliz yoki rus tilidagi CEFR darajangizni (A1-C1)
          aniqlang — natija "Ish uchun til" trekini tanlashda yordam beradi.
        </p>
        <div className="mt-6">
          <StartPlacementTestButton />
        </div>

        {sessions.length > 0 ? (
          <ul className="mt-8 flex flex-col gap-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/daraja-testi/${s.id}`}
                  className="group flex min-h-touch items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-sans text-base font-medium text-ink">
                        {LANGUAGE_LABEL[s.language] ?? s.language}
                        {s.cefr_level ? ` — ${s.cefr_level}` : ''}
                      </span>
                      <span className="font-mono text-xs text-ink-soft">
                        {formatDate(s.created_at)}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge variant={s.status === 'active' ? 'info' : 'success'}>
                      {s.status === 'active' ? 'Faol' : 'Yakunlangan'}
                    </Badge>
                    <ChevronRightIcon
                      width={18}
                      height={18}
                      className="text-ink-soft transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="imk-empty mt-8 items-center text-center">
            <span className="imk-empty__icon mx-auto">
              <ClipboardIcon width={22} height={22} aria-hidden="true" />
            </span>
            <h2 className="font-display text-lg font-bold text-ink">Hali test topshirilmagan</h2>
            <p className="mx-auto max-w-xl font-sans text-base text-ink-soft">
              Yuqoridagi tugma orqali birinchi daraja aniqlash testingizni boshlang.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
