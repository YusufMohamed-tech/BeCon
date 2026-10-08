'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ORDER_TRANSITIONS, type OrderStatus } from '@becon/shared';
import { statusLabel } from '@/lib/labels';
import { advanceOrderStatus } from '../actions';

const LABELS: Partial<Record<OrderStatus, string>> = {
  awaiting_payment: 'إعادة للدفع',
  paid: 'تأكيد الدفع',
  processing: 'بدء المعالجة',
  completed: 'وضع كمكتمل',
  awaiting_user_action: 'بانتظار العميل',
  refunding: 'بدء الاسترداد',
  refunded: 'تم الاسترداد',
  cancelled: 'إلغاء الطلب',
};

export function OrderActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = ORDER_TRANSITIONS[currentStatus] ?? [];

  function handleClick(to: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await advanceOrderStatus(orderId, to);
      if (!result.ok) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  if (nextStatuses.length === 0) {
    return <p className="muted">لا توجد إجراءات أخرى لهذه الحالة النهائية.</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {nextStatuses.map((to) => (
          <button
            key={to}
            className={`btn ${to === 'cancelled' || to === 'refunding' ? 'btn-ghost' : ''}`}
            disabled={isPending}
            onClick={() => handleClick(to)}
          >
            {LABELS[to] ?? statusLabel(to)}
          </button>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
