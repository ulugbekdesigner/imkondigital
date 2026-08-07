import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@imkon/ui';
import { getGig } from '@/lib/marketplace-api';
import { getAccessToken } from '@/lib/session';
import { getMe } from '@/lib/server-api';
import { OrderForm } from '@/components/order-form';
import { LockIcon, StarIcon } from '@/components/shell-icons';
import { formatThousands } from '@/lib/format';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const gig = await getGig(Number(params.id));
  if (!gig) return { title: 'Xizmat topilmadi' };
  return {
    title: `${gig.title} — ${gig.freelancer_name}`,
    description: gig.description || `${gig.title} xizmati IMKON Digital'da.`,
    alternates: { canonical: `/gigs/${gig.id}` },
  };
}

export default async function GigDetailPage({ params }: { params: { id: string } }) {
  const gigId = Number(params.id);
  const gig = await getGig(gigId);
  if (!gig) notFound();

  const authed = Boolean(getAccessToken());
  const me = authed ? await getMe() : null;
  const isOwner = me?.id === gig.freelancer_id;
  const freelancerInitial = gig.freelancer_name.trim().charAt(0).toUpperCase() || '?';

  return (
    <>
      <header className="bg-deep">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{gig.category}</Badge>
            {gig.is_new_talent && <Badge variant="info">Yangi iste'dod</Badge>}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold text-deep-fg">{gig.title}</h1>
          <Link
            href={`/u/${gig.freelancer_username}`}
            className="mt-3 inline-flex min-h-touch items-center gap-2 rounded-full pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-deep"
          >
            {gig.freelancer_avatar_url ? (
              // Foydalanuvchi yuklagan tashqi (MinIO) media — next/image optimallashtira olmaydi.
              <img
                src={gig.freelancer_avatar_url}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-deep-fg/15 font-display text-sm font-bold text-deep-fg"
              >
                {freelancerInitial}
              </span>
            )}
            <span className="font-sans text-md text-mist underline-offset-4 hover:underline">
              {gig.freelancer_name}
            </span>
            {gig.average_rating != null && (
              <span className="inline-flex items-center gap-1 font-sans text-sm text-mist">
                <StarIcon width={14} height={14} className="text-gold" aria-hidden="true" />
                {gig.average_rating.toFixed(1)}
                <span className="text-mist">({gig.review_count})</span>
              </span>
            )}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="font-mono text-base text-mist">
              {formatThousands(gig.price_from)} so'mdan · {gig.delivery_days} kunda tayyor
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-deep-fg/10 px-3 py-1 font-sans text-xs font-medium text-mist">
              <LockIcon width={14} height={14} aria-hidden="true" />
              Himoyalangan to'lov
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div>
            {gig.description && (
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Tavsif</h2>
                <p className="mt-2 whitespace-pre-wrap font-sans text-base text-ink-soft">
                  {gig.description}
                </p>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <OrderForm
              gigId={gig.id}
              freelancerId={gig.freelancer_id}
              defaultTitle={gig.title}
              defaultAmount={gig.price_from}
              authed={authed}
              isOwner={isOwner}
            />
          </aside>
        </div>
      </section>
    </>
  );
}
