import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Badge, GlassCard, ReadAloudButton, Skeleton, buttonVariants, cn } from '@imkon/ui';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';
import {
  AlertIcon,
  ChevronRightIcon,
  HeartIcon,
  PhoneIcon,
  ShieldIcon,
  UsersIcon,
} from '@/components/shell-icons';
import { getSupportContents, getSupportResources } from '@/lib/support-api';
import { EmptyState, ErrorState } from '@/components/state-panels';

export const metadata: Metadata = {
  title: 'Ruhiy qo\'llab-quvvatlash',
  description:
    "O'ziga ishonch, charchoq va boshqa ruhiy qiyinchiliklar bo'yicha maslahatlar hamda tasdiqlangan yordam raqamlari.",
  alternates: { canonical: '/ruhiy-kuch' },
};

const CATEGORY_LABEL: Record<string, string> = {
  hotline: 'Ishonch telefoni',
  psychologist: 'Psixolog',
  ngo: 'NNT',
  government: 'Davlat xizmati',
};

// DIQQAT (docs/design/README.md): "Ruhiy kuch" bo'limida orqa fon naqshi (.imk-orn)
// ATAYLAB yo'q — bu yerda hech qanday bezak elementi qo'shilmaydi.
export default function SupportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ruhiy qo'llab-quvvatlash"
        title="Siz yolg'iz emassiz"
        lead="Karyera yo'lidagi eng katta to'siq ko'pincha ko'nikma emas, ishonch bo'ladi. Biz tashxis qo'ymaymiz va terapiya taklif qilmaymiz — lekin qayerga murojaat qilishni bilamiz."
      />

      <section className="mx-auto max-w-3xl px-4 py-10">
        <Suspense fallback={<UrgentHelpSkeleton />}>
          <UrgentHelpBlock />
        </Suspense>

        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-line bg-paper p-4">
          <ShieldIcon className="mt-0.5 h-5 w-5 flex-none text-ink-soft" aria-hidden="true" />
          <p className="font-sans text-sm text-ink-soft">
            ZIYO (AI-yordamchi) bu bo&apos;limda maslahat bermaydi — quyida faqat tekshirilgan
            mutaxassislar tomonidan tayyorlangan matnlar beriladi.
          </p>
        </div>

        <Link
          href="/tengdosh-yordami"
          className="mt-4 flex min-h-touch items-center gap-3 rounded-xl border border-line bg-paper p-4 transition hover:-translate-y-0.5 hover:shadow-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <span
            aria-hidden="true"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-mint text-primary"
          >
            <UsersIcon className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-display text-base font-semibold text-ink">
              Tengdosh ko&apos;magi
            </span>
            <span className="block font-sans text-sm text-ink-soft">
              Yo&apos;lni bosib o&apos;tgan real odamlar bilan suhbatlashing — &quot;men ham shu
              yerda edim&quot; tuyg&apos;usi.
            </span>
          </span>
          <ChevronRightIcon className="h-5 w-5 flex-none text-ink-soft" aria-hidden="true" />
        </Link>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="font-display text-lg font-semibold text-ink">Ruhiy kuch maslahatlari</h2>
        <Suspense fallback={<AdviceListSkeleton />}>
          <AdviceList />
        </Suspense>
      </section>
    </>
  );
}

async function UrgentHelpBlock() {
  let resources;
  try {
    resources = await getSupportResources();
  } catch {
    return (
      <div className="rounded-xl border-2 border-error bg-error/10 p-6 sm:p-7">
        <UrgentHelpHeading />
        <div className="mt-4">
          <ErrorState
            title="Yordam raqamlarini yuklab bo'lmadi"
            description="Shoshilinch bo'lsa, to'g'ridan-to'g'ri 1050 (Ishonch telefoni) raqamiga qo'ng'iroq qiling."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-error bg-error/10 p-6 sm:p-7">
      <UrgentHelpHeading />
      <p className="mt-3 font-sans text-base text-ink-soft">
        Og&apos;ir holatda bo&apos;lsangiz yoki o&apos;zingizga zarar yetkazish fikri kelsa —
        hoziroq qo&apos;ng&apos;iroq qiling. Bu chaqiruv bepul va maxfiy.
      </p>
      {resources.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {resources.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper p-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-ink">{r.name}</h3>
                  <Badge variant="neutral">{CATEGORY_LABEL[r.category] ?? r.category}</Badge>
                  {r.audience_note && <Badge variant="neutral">{r.audience_note}</Badge>}
                  {r.is_free && <Badge variant="primary">Bepul</Badge>}
                </div>
                {r.description && (
                  <p className="mt-1 font-sans text-sm text-ink-soft">{r.description}</p>
                )}
              </div>
              {r.phone && (
                <a
                  href={`tel:${r.phone}`}
                  className={cn(buttonVariants({ variant: 'danger', size: 'md' }), 'font-mono text-lg')}
                >
                  <PhoneIcon className="h-4 w-4" />
                  {r.phone}
                </a>
              )}
              {!r.phone && r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-touch items-center gap-1 font-sans text-base text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  Havolani ochish
                  <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 font-sans text-base text-ink-soft">
          Yordam raqamlari tez orada qo&apos;shiladi.
        </p>
      )}
    </div>
  );
}

function UrgentHelpHeading() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-error text-error-fg"
      >
        <AlertIcon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="font-display text-lg font-bold text-ink">
          Shoshilinch yordam kerakmi?
        </h2>
        <Badge variant="error" className="mt-1">
          24/7 · Bepul · Anonim
        </Badge>
      </div>
    </div>
  );
}

function UrgentHelpSkeleton() {
  return (
    <div className="rounded-xl border-2 border-error bg-error/10 p-6 sm:p-7">
      <span className="sr-only" role="status">
        Yordam raqamlari yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32 rounded-full" />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function AdviceList() {
  let contents;
  try {
    contents = await getSupportContents();
  } catch {
    return (
      <div className="mt-4">
        <ErrorState
          title="Maslahatlarni yuklab bo'lmadi"
          description="Internet aloqasini tekshirib, qayta urinib ko'ring."
        />
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          icon={<HeartIcon width={24} height={24} aria-hidden="true" />}
          title="Maslahatlar hali tayyorlanmoqda"
          description="Mutaxassis psixolog bilan hamkorlikda tayyorlanmoqda — tez orada shu yerda paydo bo'ladi."
        />
      </div>
    );
  }

  return (
    <ul className="mt-4 flex flex-col gap-4">
      {contents.map((c) => (
        <GlassCard key={c.id} className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="neutral">{c.topic}</Badge>
            <ReadAloudButton text={`${c.title}. ${c.body_text}`} />
          </div>
          <h3 className="mt-2 font-display text-base font-semibold text-ink">{c.title}</h3>
          <p className="mt-2 whitespace-pre-wrap font-sans text-base text-ink-soft">
            {c.body_text}
          </p>
        </GlassCard>
      ))}
    </ul>
  );
}

function AdviceListSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <span className="sr-only" role="status">
        Maslahatlar yuklanmoqda…
      </span>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} aria-hidden="true" className="rounded-2xl border border-line bg-paper p-5">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="mt-3 h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-1 h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}
