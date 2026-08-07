import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cn } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getOrder, getOrderMessages, OrderForbiddenError } from '@/lib/marketplace-api';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { OrderCheckout } from '@/components/order-checkout';
import { OrderActions } from '@/components/order-actions';
import { OrderChat } from '@/components/order-chat';
import { ReviewForm } from '@/components/review-form';
import { DisputePanel } from '@/components/dispute-panel';
import { ArrowLeftIcon, CheckIcon, LockIcon } from '@/components/shell-icons';
import { formatThousands } from '@/lib/format';
import { LockedState } from '@/components/state-panels';

export const metadata: Metadata = {
  title: 'Buyurtma',
  robots: { index: false },
};

/** Escrow holat mashinasi (api/app/models/enums.py OrderStatus) — faqat
 * "baxtli yo'l" (created→…→accepted/paid) 5 bosqichli chiziq bilan
 * ko'rsatiladi. Nizo/bekor/qaytarilgan alohida, chiziqsiz izoh oladi. */
const STEPS = [
  { key: 'created', label: 'Kelishildi' },
  { key: 'funded', label: "To'lov band" },
  { key: 'in_progress', label: 'Ish jarayonda' },
  { key: 'delivered', label: 'Topshirish' },
  { key: 'accepted', label: 'Yakun' },
] as const;

const STEP_INDEX: Record<string, number> = {
  created: 0,
  funded: 1,
  in_progress: 2,
  delivered: 3,
  accepted: 4,
  paid: 4,
};

const ESCROW_MESSAGE: Record<string, string> = {
  created: "To'lov hali amalga oshirilmagan — buyurtmani boshlash uchun to'lovni yakunlang.",
  funded: "Mablag' platformada xavfsiz saqlanmoqda — ish qabul qilingach freelancerga chiqariladi.",
  in_progress: "Mablag' platformada xavfsiz saqlanmoqda — ish qabul qilingach freelancerga chiqariladi.",
  delivered: "Mablag' platformada xavfsiz saqlanmoqda — ish qabul qilingach freelancerga chiqariladi.",
  accepted: "Mablag' freelancerga chiqarildi.",
  paid: "Mablag' freelancerga chiqarildi.",
  disputed: "Mablag' platformada ushlab turilgan — moderator qarori kutilmoqda.",
  refunded: "Mablag' mijozga qaytarildi.",
  cancelled: "To'lov amalga oshirilmagan edi — buyurtma bekor qilindi.",
};

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function Participant({
  name,
  roleLabel,
  active,
}: {
  name: string;
  roleLabel: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint font-display text-sm font-bold text-ink"
      >
        {initials(name)}
      </span>
      <div>
        <p className="font-sans text-sm font-medium text-ink">
          {name}
          {active && <span className="ml-1 font-sans text-xs font-normal text-ink-soft">(siz)</span>}
        </p>
        <p className="font-sans text-xs text-ink-soft">{roleLabel}</p>
      </div>
    </div>
  );
}

function OrderProgress({ status }: { status: string }) {
  const idx = STEP_INDEX[status];
  if (idx === undefined) return null;
  const lastIndex = STEPS.length - 1;
  return (
    <ol aria-label="Buyurtma jarayoni" className="flex flex-wrap gap-x-5 gap-y-3">
      {STEPS.map((step, i) => {
        // Joriy bosqichning o'zi hali tugallanmagan — "band" (current) holatda
        // ko'rsatiladi, faqat undan OLDINGI bosqichlar "bajarildi" (done). Oxirgi
        // bosqich (Yakun) esa unga yetilgan zahoti to'liq bajarilgan hisoblanadi.
        const isLast = i === lastIndex;
        const done = i < idx || (i === idx && isLast);
        const current = i === idx && !isLast;
        return (
          <li
            key={step.key}
            aria-current={current ? 'step' : undefined}
            className="flex items-center gap-2"
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold',
                done ? 'bg-primary text-primary-fg' : 'bg-mint text-ink-soft',
                current && 'ring-2 ring-focus ring-offset-2 ring-offset-paper',
              )}
            >
              {done ? <CheckIcon width={14} height={14} /> : i + 1}
            </span>
            <span className={cn('font-sans text-sm', done ? 'font-medium text-ink' : 'text-ink-soft')}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const orderId = Number(params.id);
  const me = await getMe();
  if (!me) redirect(`/kirish?next=/buyurtmalarim/${orderId}`);

  let order;
  try {
    order = await getOrder(orderId);
  } catch (err) {
    if (err instanceof OrderForbiddenError) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Link
            href="/buyurtmalarim"
            className="inline-flex min-h-touch items-center gap-1.5 font-sans text-sm font-medium text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon width={16} height={16} aria-hidden="true" />
            Buyurtmalarim
          </Link>
          <div className="mt-4">
            <LockedState
              title="Bu buyurtma sizga tegishli emas"
              description="Faqat mijoz va freelancerning o'zi buyurtma tafsilotlarini ko'ra oladi."
            />
          </div>
        </div>
      );
    }
    throw err;
  }
  if (!order) notFound();

  const isClient = me.id === order.client_id;
  const isFreelancer = me.id === order.freelancer_id;
  const messages = await getOrderMessages(orderId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/buyurtmalarim"
        className="inline-flex min-h-touch items-center gap-1.5 font-sans text-sm font-medium text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <ArrowLeftIcon width={16} height={16} aria-hidden="true" />
        Buyurtmalarim
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{order.title}</h1>
          <p className="mt-1 font-mono text-base text-ink">
            {formatThousands(order.amount)} so'm
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 rounded-xl border border-line bg-paper p-5">
        <Participant name={order.client_name} roleLabel="Mijoz" active={isClient} />
        <Participant name={order.freelancer_name} roleLabel="Freelancer" active={isFreelancer} />
      </div>

      <div className="mt-6">
        <OrderProgress status={order.status} />
        {(order.status === 'cancelled' || order.status === 'refunded') && (
          <p className="mt-1 font-sans text-sm text-ink-soft">
            {order.status === 'cancelled'
              ? "Bu buyurtma to'lovdan oldin bekor qilingan."
              : "Nizo hal qilindi — mablag' mijozga qaytarildi."}
          </p>
        )}
      </div>

      {order.status === 'disputed' && (
        <div className="mt-6">
          <DisputePanel orderId={order.id} status={order.status} />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          {order.description && (
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Vazifa tavsifi</h2>
              <p className="mt-2 whitespace-pre-wrap font-sans text-base text-ink-soft">
                {order.description}
              </p>
            </div>
          )}

          {order.milestones.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Bosqichlar</h2>
              <ul className="mt-2 flex flex-col gap-1">
                {order.milestones.map((m) => (
                  <li
                    key={m.id}
                    className="flex justify-between rounded border border-line bg-paper px-3 py-2 font-sans text-base text-ink-soft"
                  >
                    <span>{m.title}</span>
                    <span className="font-mono">{formatThousands(m.amount)} so'm</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {order.delivered_note && (
            <div className="rounded-lg border border-line bg-mint/40 p-4">
              <h2 className="font-display text-base font-semibold text-ink">Topshirilgan ish</h2>
              <p className="mt-1 whitespace-pre-wrap font-sans text-base text-ink-soft">
                {order.delivered_note}
              </p>
              {order.delivered_file_url && (
                <a
                  href={order.delivered_file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-sans text-base text-primary underline-offset-4 hover:underline"
                >
                  Faylni ko'rish
                </a>
              )}
            </div>
          )}

          {order.status === 'paid' && <ReviewForm orderId={order.id} />}

          <OrderChat orderId={order.id} initialMessages={messages} currentUserId={me.id} />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-line bg-paper p-4">
            <div className="flex items-center gap-2">
              <LockIcon width={16} height={16} className="text-primary" aria-hidden="true" />
              <h2 className="font-display text-base font-semibold text-ink">Escrow to'lov</h2>
            </div>
            <p className="mt-1 font-mono text-lg font-bold text-ink">
              {formatThousands(order.amount)} so'm
            </p>
            <p className="mt-1 font-sans text-sm text-ink-soft">{ESCROW_MESSAGE[order.status]}</p>
          </div>

          {isClient && order.status === 'created' && <OrderCheckout orderId={order.id} />}

          <OrderActions
            orderId={order.id}
            status={order.status}
            isClient={isClient}
            isFreelancer={isFreelancer}
          />

          {order.status !== 'disputed' && (
            <DisputePanel orderId={order.id} status={order.status} />
          )}
        </aside>
      </div>
    </div>
  );
}
