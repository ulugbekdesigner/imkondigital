import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { buttonVariants, cn, Skeleton } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getMyOrdersStrict } from '@/lib/marketplace-api';
import { OrderListCard } from '@/components/order-list-card';
import { ClipboardIcon } from '@/components/shell-icons';
import { EmptyState, ErrorState } from '@/components/state-panels';
import type { OrderCard } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Buyurtmalarim',
  robots: { index: false },
};

const ROLE_TABS: { key: 'client' | 'freelancer' | undefined; label: string }[] = [
  { key: undefined, label: 'Barchasi' },
  { key: 'client', label: 'Mijoz sifatida' },
  { key: 'freelancer', label: 'Freelancer sifatida' },
];

export default async function MyOrdersPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/buyurtmalarim');

  const role = searchParams.role === 'client' || searchParams.role === 'freelancer'
    ? searchParams.role
    : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Buyurtmalarim</h1>

      <nav aria-label="Buyurtmalar filtri" className="mt-6 flex flex-wrap gap-2">
        {ROLE_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.key ? `/buyurtmalarim?role=${tab.key}` : '/buyurtmalarim'}
            aria-current={role === tab.key ? 'page' : undefined}
            className={cn(
              buttonVariants({ variant: role === tab.key ? 'primary' : 'outline', size: 'sm' }),
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersResults role={role} currentUserId={me.id} />
      </Suspense>
    </div>
  );
}

async function OrdersResults({
  role,
  currentUserId,
}: {
  role: 'client' | 'freelancer' | undefined;
  currentUserId: number;
}) {
  let orders: OrderCard[];
  try {
    orders = await getMyOrdersStrict(role);
  } catch {
    return (
      <div className="mt-8">
        <ErrorState description="Buyurtmalar ro'yxatini yuklashda xatolik yuz berdi. Qayta urinib ko'ring." />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={<ClipboardIcon width={24} height={24} aria-hidden="true" />}
          title="Hali buyurtmangiz yo'q"
          description="Freelancer xizmatlar katalogidan kerakli ishni tanlang."
          action={
            <Link href="/gigs" className={cn(buttonVariants())}>
              Xizmatlarni ko'rish
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <p className="mt-6 font-sans text-sm text-ink-soft" aria-live="polite">
        {orders.length} ta buyurtma
      </p>
      <ul className="mt-3 flex flex-col gap-4">
        {orders.map((o) => (
          <OrderListCard key={o.id} order={o} currentUserId={currentUserId} />
        ))}
      </ul>
    </>
  );
}

function OrdersSkeleton() {
  return (
    <>
      <span className="sr-only" role="status">
        Buyurtmalar yuklanmoqda…
      </span>
      <ul aria-hidden="true" className="mt-6 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-lg border border-line bg-paper p-5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </li>
        ))}
      </ul>
    </>
  );
}
