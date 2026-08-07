import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { CreateGigForm } from '@/components/create-gig-form';
import { ArrowLeftIcon, EditIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Yangi xizmat',
  robots: { index: false },
};

export default async function NewGigPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/gigs/yangi');

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href="/gigs"
        className="inline-flex min-h-touch items-center gap-1.5 font-sans text-sm font-medium text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <ArrowLeftIcon width={16} height={16} aria-hidden="true" />
        Xizmatlar katalogiga qaytish
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-primary"
        >
          <EditIcon />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Yangi xizmat joylashtirish</h1>
          <p className="font-sans text-base text-ink-soft">
            Xizmatingiz chop etilgach, katalogda darhol ko'rinadi.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <CreateGigForm />
      </div>
    </div>
  );
}
