import { Badge } from '@imkon/ui';

export const ORDER_STATUS_LABEL: Record<string, string> = {
  created: "To'lov kutilmoqda",
  funded: "To'landi",
  in_progress: 'Jarayonda',
  delivered: 'Topshirilgan',
  accepted: 'Qabul qilingan',
  paid: 'Yakunlangan',
  disputed: 'Nizoda',
  refunded: 'Qaytarilgan',
  cancelled: 'Bekor qilingan',
};

const VARIANT: Record<string, 'neutral' | 'primary' | 'warn' | 'error' | 'info'> = {
  created: 'neutral',
  funded: 'info',
  in_progress: 'info',
  delivered: 'warn',
  accepted: 'primary',
  paid: 'primary',
  disputed: 'error',
  refunded: 'error',
  cancelled: 'error',
};

export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANT[status] ?? 'neutral'}>{ORDER_STATUS_LABEL[status] ?? status}</Badge>;
}
