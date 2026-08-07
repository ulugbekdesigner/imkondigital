import Link from 'next/link';
import { Badge } from '@imkon/ui';
import { formatThousands } from '@/lib/format';
import { avatarGradient, initialsOf } from '@/lib/avatar';
import { StarIcon } from '@/components/shell-icons';
import type { GigCard as GigCardType } from '@/lib/types';

export function GigCard({ gig }: { gig: GigCardType }) {
  return (
    <li className="overflow-hidden rounded-[20px] border border-line bg-paper">
      <Link
        href={`/gigs/${gig.id}`}
        className="flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <div aria-hidden="true" className="h-24" style={{ background: avatarGradient(gig.id) }} />
        <div className="flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{gig.category}</Badge>
            {gig.is_new_talent && <Badge variant="info">Yangi iste'dod</Badge>}
          </div>
          <h3 className="font-display text-base font-bold text-ink">{gig.title}</h3>
          <div className="flex items-center gap-2">
            {gig.freelancer_avatar_url ? (
              // Foydalanuvchi yuklagan tashqi (MinIO) media — next/image optimallashtira olmaydi.
              <img
                src={gig.freelancer_avatar_url}
                alt=""
                className="h-[26px] w-[26px] shrink-0 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span
                aria-hidden="true"
                style={{ background: avatarGradient(gig.freelancer_id) }}
                className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full font-display text-[10px] font-bold text-white"
              >
                {initialsOf(gig.freelancer_name)}
              </span>
            )}
            <span className="truncate font-sans text-xs text-ink-soft">
              {gig.freelancer_name}
              {gig.average_rating != null && (
                <>
                  {' · '}
                  <span className="inline-flex items-center gap-0.5 align-middle">
                    <StarIcon width={12} height={12} className="text-gold" />
                    {gig.average_rating.toFixed(1)}
                  </span>
                </>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-sm font-bold text-ink">
              {formatThousands(gig.price_from)} so'm
            </span>
            <span className="font-mono text-xs text-ink-soft">{gig.delivery_days} kun</span>
          </div>
        </div>
      </Link>
    </li>
  );
}
