import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Skeleton, buttonVariants } from '@imkon/ui';
import { PageHeader } from '@/components/page-header';
import { ExternalJobItem } from '@/components/external-job-item';
import { EmptyState, ErrorState } from '@/components/state-panels';
import { getExternalJobs } from '@/lib/external-jobs-api';
import { BriefcaseIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Xalqaro ishlar',
  description:
    "Remote OK, Remotive va We Work Remotely'dan qonuniy agregatsiya — o'zbekcha tarjima va moslik darajasi bilan.",
  alternates: { canonical: '/xalqaro-ishlar' },
};

export default function ExternalJobsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Xalqaro ishlar"
        title="Dunyo bo'ylab masofaviy ishlar"
        lead="Remote OK, Remotive va We Work Remotely — ochiq manbalardan yig'ilgan, o'zbekchaga tarjima qilingan. Har e'lon asl manbada ochiladi — biz vositachi emas, yo'lboshchimiz."
      />

      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-teal/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-12">
          <Suspense fallback={<ExternalJobsSkeleton />}>
            <ExternalJobsResults />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function ExternalJobsResults() {
  const page = await getExternalJobs({});

  if (page === null) {
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState
          title="E'lonlarni yuklab bo'lmadi"
          description="Server bilan bog'lanishda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring."
        />
      </div>
    );
  }

  const { items } = page;

  return (
    <>
      <p className="font-mono text-sm text-ink-soft" aria-live="polite">
        {items.length > 0 ? `${items.length} ta xalqaro e'lon` : "Xalqaro e'lonlar"}
      </p>

      {items.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((job) => (
            <ExternalJobItem key={job.id} job={job} />
          ))}
        </ul>
      ) : (
        <div className="mx-auto mt-6 max-w-lg">
          <EmptyState
            icon={<BriefcaseIcon width={22} height={22} aria-hidden="true" />}
            title="Hozircha e'lon yo'q"
            description="Ma'lumotlar tez orada yangilanadi."
            action={
              <Link href="/vakansiyalar" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Mahalliy vakansiyalarni ko'rish
              </Link>
            }
          />
        </div>
      )}
    </>
  );
}

function ExternalJobsSkeleton() {
  return (
    <>
      <span className="sr-only" role="status">
        Xalqaro e'lonlar yuklanmoqda…
      </span>
      <div>
        <Skeleton className="h-4 w-40" />
      </div>
      <ul aria-hidden="true" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
