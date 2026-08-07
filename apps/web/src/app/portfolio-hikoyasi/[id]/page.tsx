import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getCaseStorySession } from '@/lib/ai-api';
import { CaseStoryChat } from '@/components/case-story-chat';
import { ArrowLeftIcon, SparkIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Case-hikoya',
  robots: { index: false },
};

export default async function CaseStorySessionPage({ params }: { params: { id: string } }) {
  const me = await getMe();
  if (!me) redirect(`/kirish?next=/portfolio-hikoyasi/${params.id}`);

  const session = await getCaseStorySession(Number(params.id));
  if (!session) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Link
        href="/profil#yutuqlarim"
        className="inline-flex min-h-touch items-center gap-1.5 rounded font-sans text-sm text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <ArrowLeftIcon width={16} height={16} />
        Portfolioga qaytish
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
          <SparkIcon width={20} height={20} aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            Ziyo bilan case-hikoya
          </p>
          <h1 className="font-display text-2xl font-bold text-ink">
            {session.portfolio_item_title}
          </h1>
        </div>
      </div>
      <p className="mt-3 font-sans text-base text-ink-soft">
        Ziyo bilan birga case-hikoyangizni yozing — vazifa, jarayon va natijani gapirib bering.
      </p>
      <div className="mt-6">
        <CaseStoryChat session={session} />
      </div>
    </div>
  );
}
