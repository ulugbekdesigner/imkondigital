import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getInterviewSession } from '@/lib/ai-api';
import { InterviewChat } from '@/components/interview-chat';
import { ArrowLeftIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Suhbat mashqi',
  robots: { index: false },
};

export default async function InterviewSessionPage({ params }: { params: { id: string } }) {
  const me = await getMe();
  if (!me) redirect(`/kirish?next=/suhbat-mashqi/${params.id}`);

  const session = await getInterviewSession(Number(params.id));
  if (!session) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/suhbat-mashqi"
        className="inline-flex min-h-touch items-center gap-1.5 rounded font-sans text-sm text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <ArrowLeftIcon width={16} height={16} />
        Barcha mashqlar
      </Link>

      <div className="mt-4">
        <InterviewChat session={session} />
      </div>
    </div>
  );
}
