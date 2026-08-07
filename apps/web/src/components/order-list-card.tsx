import Link from 'next/link';
import { formatThousands } from '@/lib/format';
import type { OrderCard } from '@/lib/types';
import { OrderStatusBadge } from './order-status-badge';

export function OrderListCard({ order, currentUserId }: { order: OrderCard; currentUserId: number }) {
  const isClient = currentUserId === order.client_id;
  const counterpart = isClient ? order.freelancer_name : order.client_name;
  const roleLabel = isClient ? 'Mijoz sifatida' : 'Freelancer sifatida';

  return (
    <li className="rounded-lg border border-line bg-paper">
      <Link
        href={`/buyurtmalarim/${order.id}`}
        className="flex flex-col gap-2 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-ink">{order.title}</h3>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="font-sans text-base text-ink-soft">
          {roleLabel} · {counterpart}
        </p>
        <p className="font-mono text-xs text-ink-soft">
          {formatThousands(order.amount)} so'm
        </p>
      </Link>
    </li>
  );
}
